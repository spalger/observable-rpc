import * as Rx from 'rxjs'
import { tap, take, map, dematerialize, takeUntil, share } from 'rxjs/operators'

import { createSocket } from './socket'
import { errorPacketToError } from './error_packet'
import { parseOptions } from './options'
import { logWarning } from './log_warning'

export class ObservableRpcClient {
  constructor(options) {
    const { url } = parseOptions(options)

    this._nextId = 1
    this._socket = createSocket(url)

    // share listener for "disconnect" since everything is using it and
    // that might trigger "possible memory leak" warnings
    this._disconnect$ = Rx.fromEvent(this._socket, 'disconnect').pipe(share())

    // emitted by the socket when an error can't be associated with a specific request
    this._socket.on('rpc:e', errorPacket => {
      logWarning(errorPacketToError(errorPacket))
    })
  }

  call(method, params) {
    return Rx.Observable.create(observer => {
      const id = this._nextId++

      // if sendUnsub === true when the observer is unsubscribed
      // then we will send an `unsubscribe` message to the server
      let sendUnsub = true
      const dontSendUnsub = () => {
        sendUnsub = false
      }

      // emit complete/error notifications by racing the
      // end, complete, or disconnect events
      const outcome$ = Rx.race(
        Rx.fromEvent(this._socket, `rpc:e:${id}`).pipe(
          map(errorPacketToError),
          map(Rx.Notification.createError)
        ),

        Rx.fromEvent(this._socket, `rpc:c:${id}`).pipe(
          map(Rx.Notification.createComplete)
        ),

        this._disconnect$.pipe(
          map(() =>
            Rx.Notification.createError(new Error('RPC socket disconnected'))
          )
        )
      ).pipe(take(1), tap(dontSendUnsub), share())

      observer.add(
        Rx.merge(
          // emit next notifications until an outcome is determined
          Rx.fromEvent(this._socket, `rpc:n:${id}`).pipe(
            map(Rx.Notification.createNext),
            takeUntil(outcome$)
          ),

          // emit notifications representing the outcome
          outcome$
        )
          .pipe(dematerialize())
          .subscribe(observer)
      )

      observer.add(() => {
        if (sendUnsub) {
          this._socket.emit(`rpc:unsubscribe:${id}`)
        }
      })

      // request that the server start sending us events for this method+params
      this._socket.emit('rpc:subscribe', {
        id,
        method,
        params,
      })
    })
  }
}
