import * as Rx from 'rxjs'
import { dematerialize, map, share, take, takeUntil, tap } from 'rxjs/operators'

import { RpcError } from './rpc_error'
import { sharedDisconnect } from './shared_disconnect'

/**
 * Receive notifications for a subId on a socket and
 * convert them into an Observable. If the Observable
 * is unsubscribed then an unsubscribe notification is
 * emitted on the socket.
 *
 * @param  {SocketIoSocket} socket
 * @param  {number} subId
 * @return {Observable}
 */
export function receive(socket, subId) {
  return new Rx.Observable(observer => {
    // if sendUnsub === true when the observer is unsubscribed
    // then we will send an `unsubscribe` message to the server
    let sendUnsub = true
    const dontSendUnsub = () => {
      sendUnsub = false
    }

    const outcome$ = Rx.race(
      Rx.fromEvent(socket, `rpc:e:${subId}`).pipe(
        map(RpcError.fromErrorPacket),
        map(Rx.Notification.createError)
      ),

      Rx.fromEvent(socket, `rpc:c:${subId}`).pipe(
        map(Rx.Notification.createComplete)
      ),

      sharedDisconnect(socket).pipe(
        map(() =>
          Rx.Notification.createError(
            new RpcError({
              message: 'RPC socket disconnected',
              statusCode: null,
            })
          )
        )
      )
    ).pipe(take(1), tap(dontSendUnsub), share())

    observer.add(
      Rx.merge(
        // emit next notifications until an outcome is determined
        Rx.fromEvent(socket, `rpc:n:${subId}`).pipe(
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
        socket.emit(`rpc:unsub:${subId}`)
      }
    })
  })
}
