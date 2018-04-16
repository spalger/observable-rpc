import { inspect } from 'util'

import createDebug from 'debug'

export function createLogConsumer(debugName) {
  const debug = createDebug(debugName)

  return log$ =>
    log$.subscribe(({ level, msg, data }) => {
      debug(`${level}: ${msg} ${data !== undefined ? inspect(data) : ''}`)
    })
}
