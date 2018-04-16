import createSocketIo from 'socket.io'
import * as Rx from 'rxjs'
import { mergeMap, share, shareReplay, take, takeUntil } from 'rxjs/operators'
import { RpcError, send } from '@observable-rpc/core'

import { Joi } from './joi'
import { parseOptions } from './options'
import { validate } from './validate'

const ReqSchema = Joi.object()
  .keys({
    method: Joi.string().required(),
    params: Joi.any(),
  })
  .default()

export class ObservableRpcRouter {
  constructor(options) {
    const { server, methodsByName, createContext$, log, path } = parseOptions(
      options
    )

    this._methodsByName = methodsByName
    this._createContext$ = createContext$
    this._log = log

    this._io = createSocketIo(server, {
      path,
      serveClient: false,
    })

    this._io.on('connection', socket => {
      this._onSocket(socket)
    })
  }

  _onSocket(socket) {
    let nextSubId = 1

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
        socket.emit(
          'rpc:e',
          RpcError.from(error, {
            message: 'Context error',
          })
        )
        socket.disconnect(true)
      },
    })

    socket.on('rpc:sub', (req, cb) => {
      try {
        req = validate(req, ReqSchema, {
          desc: 'Request validation',
        })
      } catch (error) {
        cb({ error: RpcError.from(error) })
        return
      }

      this._log.debug('rpc:sub', {
        req,
      })

      const method = this._methodsByName.get(req.method)
      if (!method) {
        cb({
          error: RpcError.notFound(`Unknown method '${req.method}'`),
        })
        return
      }

      const subId = nextSubId++

      // send subId before subscribing to ensure it arrives
      // before sync notifications are sent
      cb({ subId })

      const result$ = context$.pipe(
        // only get context at time of request once
        take(1),

        // execute the method and merge the result observable
        mergeMap(context => {
          return method.call(
            method.validateParams(req.params, socket, subId),
            context
          )
        })
      )

      send(this._log, socket, result$, subId)
    })
  }

  async close() {
    await new Promise((resolve, reject) => {
      this._io.close(error => {
        error ? reject(error) : resolve()
      })
    })
  }
}
