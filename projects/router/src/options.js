import { defaultLogger } from './logger'
import { Method } from './method'

const createEmptyContext$ = () => [{}]

export function parseOptions(options) {
  const {
    server,
    methods,
    log = defaultLogger,
    path = '/rpc',
    createContext$ = createEmptyContext$,
  } = options

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
    createContext$,
    log,
    methodsByName: new Map(
      methods.map(spec => {
        const method = new Method(spec)
        return [method.getName(), method]
      })
    ),
  }
}
