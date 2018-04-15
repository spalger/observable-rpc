import { format as formatUrl, parse as parseUrl } from 'url'

export function parseOptions(options) {
  if (!options.url && typeof window !== 'undefined') {
    const current = parseUrl(window.location.href) // eslint-disable-line no-undef

    options.url = formatUrl({
      protocol: current.protocol,
      hostname: current.hostname,
      port: current.port,
      path: '/rpc',
    })
  }

  if (!options.url) {
    throw new TypeError(
      'ObservableRpcClient options require a url when not run in a browser window'
    )
  }

  return {
    url: options.url,
  }
}
