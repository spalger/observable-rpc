import { format as formatUrl, parse as parseUrl } from 'url'

import * as Rx from 'rxjs'
import { Logger, createLogConsumer } from '@observable-rpc/core'

function defaultUrl() {
  if (typeof window === 'undefined') {
    return undefined
  }

  const current = parseUrl(window.location.href) // eslint-disable-line no-undef

  return formatUrl({
    protocol: current.protocol,
    hostname: current.hostname,
    port: current.port,
    path: '/rpc',
  })
}

export function parseOptions(options = {}) {
  const {
    url = defaultUrl(),
    consumeLog$ = createLogConsumer('@observable-rpc/client'),
  } = options

  if (!url) {
    throw new TypeError(
      'ObservableRpcClient options require a url when not run in a browser window'
    )
  }

  const log = new Logger()
  consumeLog$(Rx.from(log))

  return {
    url,
    log,
  }
}
