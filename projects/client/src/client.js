import * as Rx from 'rxjs'
import { filter, tap } from 'rxjs/operators'

import { logWarning, createSocket, errorResponseToError } from './lib'

export function createRxRpcClient(url) {
  let idCounter = 0
  const socket = createSocket(url)

  return new class RpcClient {
    subscribe(method, params) {
      return Rx.Observable.create(observer => {
        const id = ++idCounter
        let needAbort = true

        // consume the incoming responses for this request
        observer.add(
          Rx.fromEvent(socket, 'notif')
            .pipe(
              filter(msg => msg.id === id),
              tap(({ kind, value, error }) => {
                switch (kind) {
                  case 'N':
                    observer.next(value)
                    return
                  case 'C':
                    needAbort = false
                    observer.complete()
                    return
                  case 'E':
                    needAbort = false
                    observer.error(errorResponseToError(error))
                    return
                  default:
                    logWarning('Unexpected message kind', kind)
                    return
                }
              })
            )
            .subscribe({
              error(error) {
                logWarning('Unhandled error in RpcClient#subscribe()', error)
                observer.error()
              },
              complete() {
                logWarning(
                  'Unexpected completion of socket notifications in RpcClient#subscribe()'
                )
              },
            })
        )

        // if we unsub before we get "complete" or "error"
        // then ask the server to abort
        observer.add(() => {
          if (needAbort) {
            socket.emit('rpc:abort', { id })
          }
        })

        // send the actual request to the server
        socket.emit('rpc:subscribe', {
          id,
          method,
          params,
        })
      })
    }
  }()
}
