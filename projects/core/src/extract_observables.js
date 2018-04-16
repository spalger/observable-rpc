import cloneDeepWith from 'lodash.clonedeepwith'
import * as Rx from 'rxjs'

function isObservable(value) {
  return (
    // truthy value
    value &&
    // that responds to the
    typeof value[Rx.observable] === 'function' &&
    value[Rx.observable]() === value
  )
}

export function extractObservables(withObservables) {
  const observables = []
  return {
    observables,
    value: cloneDeepWith(withObservables, value => {
      if (!isObservable(value)) {
        return undefined
      }

      const i = observables.length
      observables.push(value)
      return `observable:${i}`
    }),
  }
}
