import createSocketIo from 'socket.io'
import Boom from 'boom'
import * as Rx from 'rxjs'
import {
  mergeMap,
  share,
  shareReplay,
  take,
  takeUntil,
  tap,
} from 'rxjs/operators'

import { parseOptions } from './options'
import { Request } from './request'

export class ObservableRpcRouter {
  constructor(options) {
    const { server, methodsByName, createContext$, log, path } = parseOptions(
      options
    )

    this._methodsByName = methodsByName
    this._createContext$ = createContext$
    this._log = log

    this._io = createSocketIo(server, {
      path: path,
      serveClient: false,
    })

    this._io.on('connection', socket => {
      this._onSocket(socket)
    })
  }

  _onSocket(socket) {
    // share a subscription to the socket's "disconnect" event to prevent
    // "potential memory leak" warnings from node because everything listens
    // for the socket disconnect event
    const disconnect$ = Rx.fromEvent(socket, 'disconnect').pipe(share())

    // share a replay observable so that even if the context only
    // produces a single value and completes (the default behavior)
    // we can retreive the context for each method call
    const context$ = Rx.from(this._createContext$(socket)).pipe(
      takeUntil(disconnect$),
      shareReplay(1)
    )

    // subscribe to context globally so that errors from context
    // can disconnect the socket
    context$.subscribe({
      error(error) {
        Boom.boomify(error, { message: 'Context error' })
        socket.emit('rpc:e', this._errorToErrorPacket(error))
        socket.disconnect(true)
      },
    })

    socket.on('rpc:subscribe', reqSpec => {
      let req
      try {
        req = new Request(reqSpec)
      } catch (error) {
        socket.emit('rpc:e', this._errorToErrorPacket(error))
        return
      }

      this._log('info', 'rpc:subscribe', req)

      // emit the method for this request
      const method$ = Rx.defer(() => {
        const method = this._methodsByName.get(req.method)

        if (!method) {
          this._log('warning', 'rpc:subscribe with unknown method', req)
          throw Boom.notFound(`Unknown method '${req.method}'`)
        }

        return [method]
      })

      // emit when we should stop sending notifications and unsubscribe
      const abort$ = Rx.race(
        Rx.fromEvent(socket, `rpc:unsubscribe:${req.id}`),
        disconnect$
      )

      Rx.combineLatest(method$, context$)
        .pipe(
          // only get the method+context combo once
          take(1),

          // execute the method and merge the result observable
          mergeMap(([method, context]) => method.exec(req, context)),

          // send notifications from result to the socket
          tap({
            next(value) {
              socket.emit(`rpc:n:${req.id}`, value)
            },

            error(error) {
              if (!(error instanceof Error)) {
                this._log(
                  'warning',
                  `rpc method '${req.method}' emitted a non-error error`,
                  { req, error }
                )

                error = new Error(`${typeof error} thrown`)
              }

              socket.emit(`rpc:e:${req.id}`, this._errorToErrorPacket(error))
            },

            complete() {
              socket.emit(`rpc:c:${req.id}`)
            },
          }),

          // unsubscribes from results and stops sending notifications to the socket
          takeUntil(abort$)
        )
        .subscribe()
    })
  }

  _errorToErrorPacket(error) {
    Boom.boomify(error, {
      statusCode: 500,
      message: 'Unhandled Error',
      override: false,
    })

    if (error.isServer) {
      this._log('error', 'rpc error', {
        error,
      })
    }

    return error.output.payload
  }

  async close() {
    await new Promise((resolve, reject) => {
      this._io.close(error => {
        error ? reject(error) : resolve()
      })
    })
  }
}
