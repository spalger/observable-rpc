import { Logger } from './logger'
import { Method } from './method'

export function parseOptions(options) {
  if (!options.server) {
    throw new Error(
      `createRpcRouter() requires a server option, received ${options.server}`
    )
  }

  if (!Array.isArray(options.methods)) {
    throw new Error(
      `createRpcRouter() requires an array of methods, received ${
        options.methods
      }`
    )
  }

  return {
    server: options.server,
    log: new Logger(options.log),
    methodsByName: new Map(
      options.methods.map(spec => {
        const method = new Method(spec)
        return [method.getName(), method]
      })
    ),
  }
}
