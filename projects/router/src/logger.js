import { inspect } from 'util'

import createDebug from 'debug'
const debug = createDebug('@observable-rpc/router')

export const defaultLogger = (level, msg, data) => {
  debug(`${level}: ${msg} ${data !== undefined ? inspect(data) : ''}`)
}
