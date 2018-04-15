import * as Rx from 'rxjs'
import { tap, map, dematerialize } from 'rxjs/operators'

import { createSocket, errorResponseToError, logWarning } from './lib'

export function createRpcClient(url) {
  let idCounter = 0

  const socket = createSocket(url)

  socket.on('rpc:e', error => {
    logWarning(errorResponseToError(error))
  })

  return new class RpcClient {
    get(method, params) {
      return Rx.Observable.create(observer => {
        const id = ++idCounter
        let sendUnsub = true

        // consume the incoming responses for this request
        observer.add(
          Rx.merge(
            Rx.fromEvent(socket, `rpc:n:${id}`).pipe(
              map(value => Rx.Notification.createNext(value))
            ),
            Rx.fromEvent(socket, `rpc:e:${id}`).pipe(
              tap(() => {
                sendUnsub = false
              }),
              map(error =>
                Rx.Notification.createError(errorResponseToError(error))
              )
            ),
            Rx.fromEvent(socket, `rpc:c:${id}`).pipe(
              tap(() => {
                sendUnsub = false
              }),
              map(() => Rx.Notification.createComplete())
            )
          )
            .pipe(dematerialize())
            .subscribe(observer)
        )

        // if we unsub before we get "complete" or "error"
        // then ask the server to stop sending responses for this request
        observer.add(() => {
          if (sendUnsub) {
            socket.emit('rpc:unsubscribe', { id })
          }
        })

        // send the subscription request to the server
        socket.emit('rpc:subscribe', {
          id,
          method,
          params,
        })
      })
    }
  }()
}
