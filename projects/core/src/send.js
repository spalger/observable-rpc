import * as Rx from 'rxjs'
import { takeUntil, tap, catchError } from 'rxjs/operators'
import { sharedDisconnect } from './shared_disconnect'
import { RpcError } from './rpc_error'

/**
 * Send the events from an observable over a socket. The source
 * will be subscribed internally and the only way to stop the
 * notifications if for the socket to unsub from the `subId` or
 * for the socket to disconnect.
 *
 * @param  {Logger} log
 * @param  {SocketIoSocket} socket
 * @param  {Observable} source
 * @param  {number} subId
 * @return {undefined}
 */
export function send(log, socket, source, subId) {
  source
    .pipe(
      // send notifications from result to the socket
      tap({
        next(value) {
          socket.emit(`rpc:n:${subId}`, value)
        },

        error(error) {
          if (!(error instanceof Error)) {
            log.error('Non-error emitted by observable', {
              subId,
              source,
              error,
            })

            error = new Error(`${typeof error} thrown`)
          }

          const rpcError = RpcError.from(error)

          if (rpcError.statusCode === 500) {
            log.error('Server error', { subId, source, error: rpcError })
          }

          socket.emit(`rpc:e:${subId}`, rpcError)
        },

        complete() {
          socket.emit(`rpc:c:${subId}`)
        },
      }),

      // silence errors and complete since they are passed to the socket
      catchError(() => []),

      // unsubscribes from source and sending notifications
      // when the socket unsubscribes or disconnects
      takeUntil(
        Rx.race(
          Rx.fromEvent(socket, `rpc:unsub:${subId}`),
          sharedDisconnect(socket)
        )
      )
    )
    .subscribe()
}
