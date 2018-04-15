import createSocketIo from 'socket.io'
import Boom from 'boom'
import * as Rx from 'rxjs'
import { subscribeOn } from 'rxjs/operators'

import { parseOptions } from './options'
import { Request } from './request'

export class ObservableRpcRouter {
  constructor(options) {
    const { server, methodsByName, log, path } = parseOptions(options)

    this._methodsByName = methodsByName
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
    const subscriptions = new Map()

    socket.on('rpc:subscribe', reqSpec => {
      let req
      try {
        req = new Request(reqSpec)
      } catch (error) {
        socket.emit(
          'rpc:e',
          Boom.badRequest(`Invalid request: ${error.message}`).output.payload
        )
        return
      }

      this._log('info', 'rpc:subscribe', req)

      if (subscriptions.has(req.id)) {
        this._log('warning', 'rpc:subscribe with existing id', req)
        socket.emit(
          `rpc:e`,
          Boom.badRequest(
            `'rpc:subscribe' received for existing subscription id '${req.id}'`
          ).output.payload
        )
        return
      }

      subscriptions.set(
        req.id,
        Rx.defer(() => {
          const method = this._methodsByName.get(req.method)

          if (!method) {
            this._log('warning', 'rpc:subscribe with unknown method', req)
            throw Boom.notFound(`Unknown method '${req.method}'`)
          }

          return method.exec(req)
        })
          .pipe(
            // ensure that subscription is in subscriptions map before
            // any notifications are delivered so that we can safely call
            // subscriptions.delete()
            subscribeOn(Rx.asyncScheduler)
          )
          .subscribe({
            next(value) {
              socket.emit(`rpc:n:${req.id}`, value)
            },
            error(error) {
              if (!(error instanceof Error)) {
                this._log('warning', `rpc method emitted a non-error error`, {
                  req,
                  error,
                })

                error = new Error(`${typeof error} thrown`)
              }

              Boom.boomify(error, {
                statusCode: 500,
                message: 'Unhandled Error',
                override: false,
              })

              if (error.isServer) {
                this._log('error', 'rpc method error', {
                  error,
                })
              }

              subscriptions.delete(req.id)
              socket.emit(`rpc:e:${req.id}`, error.output.payload)
            },
            complete() {
              subscriptions.delete(req.id)
              socket.emit(`rpc:c:${req.id}`)
            },
          })
      )
    })

    socket.on('rpc:unsubscribe', ({ id }) => {
      if (!subscriptions.has(id)) {
        // noop
        return
      }

      this._log('info', 'rpc:unsubscribe', { id })
      subscriptions.get(id).unsubscribe()
      subscriptions.delete(id)
    })

    socket.on('disconnect', () => {
      for (const [id, subscription] of subscriptions) {
        subscriptions.delete(id)
        subscription.unsubscribe()
      }
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
