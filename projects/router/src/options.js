import * as Rx from 'rxjs'
import { Logger, createLogConsumer } from '@observable-rpc/core'

import { Method } from './method'

const createEmptyContext$ = () => [{}]

export function parseOptions(options) {
  const {
    server,
    methods,
    consumeLog$ = createLogConsumer('@observable-rpc/router'),
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

  const log = new Logger()
  consumeLog$(Rx.from(log))

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
