import * as Rx from 'rxjs'
import { filter, mapTo, publishBehavior } from 'rxjs/operators'

const cache = new WeakMap()

export function sharedDisconnect(socket) {
  const cached = cache.get(socket)
  if (cached) {
    return cached
  }

  const state$ = Rx.merge(
    Rx.fromEvent(socket, 'connect').pipe(mapTo('connect')),
    Rx.fromEvent(socket, 'disconnect').pipe(mapTo('disconnect'))
  ).pipe(
    // start in a connected state because we don't get
    // a 'connect' event on the server and **currently**
    // we are only interested in a disconnect after a
    // connect anyway, so it's really the first disconnect
    // and connects after that which are important
    publishBehavior('connect')
  )

  // start listening for events now and never unsub as long
  // as `socket` is within scope somewhere
  state$.connect()

  const obs = state$.pipe(filter(s => s === 'disconnect'), mapTo(undefined))
  cache.set(socket, obs)
  return obs
}
