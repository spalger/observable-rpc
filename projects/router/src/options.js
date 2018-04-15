import { defaultLogger } from './logger'
import { Method } from './method'

export function parseOptions(options) {
  const { server, log, methods, path = '/rpc' } = options

  if (!server) {
    throw new Error(
      `createRpcRouter() requires a server option, received ${server}`
    )
  }

  if (!methods) {
    throw new Error(
      `createRpcRouter() requires an array of methods, received ${methods}`
    )
  }

  return {
    server,
    path,
    log: log || defaultLogger,
    methodsByName: new Map(
      methods.map(spec => {
        const method = new Method(spec)
        return [method.getName(), method]
      })
    ),
  }
}
