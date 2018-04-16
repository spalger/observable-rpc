import * as Rx from 'rxjs'

import { receive, RpcError } from '@observable-rpc/core'

import { createSocket } from './socket'
import { parseOptions } from './options'

export class ObservableRpcClient {
  constructor(options) {
    const { url, log } = parseOptions(options)
    this._socket = createSocket(url)

    // emitted by the socket when an error can't be associated with a specific request
    this._socket.on('rpc:e', errorPacket => {
      log.error('General error', {
        error: RpcError.fromErrorPacket(errorPacket),
      })
    })
  }

  call(method, params) {
    return new Rx.Observable(observer => {
      this._socket.emit(
        'rpc:sub',
        {
          method,
          params,
        },
        ({ error, subId }) => {
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
