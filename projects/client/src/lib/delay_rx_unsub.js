export const delayRxUnsub = (ms = 1500) => observable =>
  observable.lift({
    call(observer, source) {
      let stopped = false
      let timer = null
      function onTerminalEvent() {
        stopped = true
        if (timer) clearTimeout(timer)
      }

      const sub = source.subscribe({
        next(v) {
          if (stopped) return
          observer.next(v)
        },
        error(v) {
          if (stopped) return
          onTerminalEvent()
          observer.error(v)
        },
        complete() {
          if (stopped) return
          onTerminalEvent()
          observer.complete()
        },
      })

      observer.add(function onUnsub() {
        if (!stopped) {
          stopped = true
          timer = setTimeout(() => sub.unsubscribe(), ms)
        }
      })
    },
  })
