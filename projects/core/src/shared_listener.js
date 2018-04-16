import * as Rx from 'rxjs'
import { shareReplay } from 'rxjs/operators'

const caches = new Map()

export function sharedListener(emitter, event) {
  let cache
  if (!caches.has(event)) {
    cache = new WeakMap()
    caches.set(event, cache)
  } else {
    cache = caches.get(event)
  }

  let listener
  if (!cache.has(emitter)) {
    listener = Rx.fromEvent(emitter, event).pipe(shareReplay(1))
    cache.set(emitter, listener)
  } else {
    listener = cache.get(emitter)
  }

  return listener
}
