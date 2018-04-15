import createSocketIo from 'socket.io'
import Boom from 'boom'
import * as Rx from 'rxjs'
import { subscribeOn } from 'rxjs/operators'

import { parseOptions } from './options'
import { Request } from './request'

export function createRxRpcRouter(options) {
  const { server, methodsByName, log } = parseOptions(options)

  const io = createSocketIo(server, {
    path: '/rpc',
    serveClient: false,
  })

  io.on('connection', socket => {
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

      log.info('rpc:subscribe', req)

      if (subscriptions.has(req.id)) {
        log.warning('rpc:subscribe with existing id', req)
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
          const method = methodsByName.get(req.method)

          if (!method) {
            log.warning('rpc:subscribe with unknown method', req)
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
                log.warning(`rpc method emitted a non-error error`, {
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
                log.error('rpc method error', {
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

      log.info('rpc:unsubscribe', { id })
      subscriptions.get(id).unsubscribe()
      subscriptions.delete(id)
    })

    socket.on('disconnect', () => {
      for (const [id, subscription] of subscriptions) {
        subscriptions.delete(id)
        subscription.unsubscribe()
      }
    })
  })

  return new class RxRpcRouter {
    async close() {
      await new Promise((resolve, reject) => {
        io.close(error => {
          error ? reject(error) : resolve()
        })
      })
    }
  }()
}
