import * as Rx from 'rxjs'
import { tap, map, dematerialize } from 'rxjs/operators'

import { createSocket } from './socket'
import { errorResponseToError } from './errors'
import { parseOptions } from './options'
import { logWarning } from './log_warning'

export class ObservableRpcClient {
  constructor(options) {
    const { url } = parseOptions(options)

    this._nextId = 1
    this._socket = createSocket(url)

    // non-request error handler
    this._socket.on('rpc:e', error => {
      logWarning(errorResponseToError(error))
    })
  }

  call(method, params) {
    return Rx.Observable.create(observer => {
      const id = this._nextId++
      let sendUnsub = true

      // consume the incoming responses for this request
      observer.add(
        Rx.merge(
          Rx.fromEvent(this._socket, `rpc:n:${id}`).pipe(
            map(value => Rx.Notification.createNext(value))
          ),
          Rx.fromEvent(this._socket, `rpc:e:${id}`).pipe(
            tap(() => {
              sendUnsub = false
            }),
            map(error =>
              Rx.Notification.createError(errorResponseToError(error))
            )
          ),
          Rx.fromEvent(this._socket, `rpc:c:${id}`).pipe(
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
          this._socket.emit('rpc:unsubscribe', { id })
        }
      })

      // send the subscription request to the server
      this._socket.emit('rpc:subscribe', {
        id,
        method,
        params,
      })
    })
  }
}
