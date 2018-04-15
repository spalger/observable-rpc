import { format } from 'util'

import createDebug from 'debug'

export class Logger {
  constructor(handler) {
    if (handler) {
      this._handler = handler
    }

    const debug = createDebug('@observable-rpc/router')
    this._handler = {
      info(...args) {
        debug(`info: ${format(...args)}`)
      },
      warning(...args) {
        debug(`warning: ${format(...args)}`)
      },
      error(...args) {
        debug(`error: ${format(...args)}`)
      },
    }
  }

  info(...args) {
    if (this._handler.info) {
      this._handler.info(...args)
    }
  }

  warning(...args) {
    if (this._handler.warning) {
      this._handler.warning(...args)
    }
  }

  error(...args) {
    if (this._handler.error) {
      this._handler.error(...args)
    }
  }
}
