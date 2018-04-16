import * as Rx from 'rxjs'
import { tap } from 'rxjs/operators'

import {
  send,
  receive,
  RpcError,
  extractObservables,
} from '@observable-rpc/core'

import { createSocket } from './socket'
import { parseOptions } from './options'

export class ObservableRpcClient {
  constructor(options) {
    const { url, log } = parseOptions(options)
    this._log = log
    this._socket = createSocket(url)

    // emitted by the socket when an error can't be associated with a specific request
    this._socket.on('rpc:e', errorPacket => {
      log.error('General error', {
        error: RpcError.fromErrorPacket(errorPacket),
      })
    })
  }

  call(method, params) {
    const {
      value: paramsWithObservablePlaceholders,
      observables: paramObservables,
    } = extractObservables(params)

    return new Rx.Observable(observer => {
      this._socket.emit(
        'rpc:sub',
        {
          method,
          params: paramsWithObservablePlaceholders,
        },
        ({ error, subId }) => {
          observer.add(
            Rx.merge(
              ...paramObservables.map((obs, i) =>
                Rx.fromEvent(this._socket, `rpc:sub:${subId}.${i}`).pipe(
                  tap(() => send(this._log, this._socket, obs, `${subId}.${i}`))
                )
              )
            ).subscribe()
          )

          if (error) {
            observer.error(RpcError.fromErrorPacket(error))
          } else {
            observer.add(receive(this._socket, subId).subscribe(observer))
          }
        }
      )
    })
  }
}
