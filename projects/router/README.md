# `@observable-rpc/router`

Creates a router that accepts WebSocket requests for methods to be run on the server.

Use the `@observable-rpc/client` package to call to the router from the browser.

## API

### `ObservableRpcRouter(options)`

```js
import { ObservableRpcRouter } from '@observable-rpc/router'
const router = new ObservableRpcRouter(options)
```

Wraps a Socket.IO WebSocket server and maps requests from clients to methods.

#### options
- **`options.server`: `HttpServer`**

  A server from the `http` or `https` module

- **`options.path`: `String`**

  Default: `/rpc`. The path on your server where the `ObservableRpcClient` will mount itself and handle requests.

- **`options.consumeLog$`: `(log$) => void`**

  By default log messages from `ObservableRpcRouter` are handled with [`debug`](https://www.npmjs.com/package/debug). Pass a consumeLog$ function to receive a stream of log events to handle them yourself. Log events have the following properties:

  - `level: 'error'|'info'|'debug'`: The level for the log message

  - `msg: String`: The log message, probably pretty short

  - `data: any`: Metadata relevant to the specific log message

- **`options.methods`: `Array<MethodSpec>`**

  An array of methods to expose for RPC. Each `MethodSpec` should be an object that has the following properties:

  - `name: String`: The name that clients will use to call this method

  - `validate: (Joi) => JoiSchema`: *optional* -- A function to generate a [Joi](https://github.com/hapijs/joi) schema that will be used to validate params sent from callers.<br>
    <br>
    In addition to the standard validation types available on the [Joi API](https://github.com/hapijs/joi/blob/master/API.md), the `Joi.observable()` function can be used to define a parameter from Clients that should be an observable. `Joi.observable().items(...a Joi schema...)` can be used to validate the items that the observable emits, sending errors to the Client when they emit invalid items. See the [reverse example](https://github.com/spalger/observable-rpc/blob/8980706c33296635e6a3919f89fd1eaf0bb7b38c/projects/example/run.js#L31-L46) for example usage.

  - `handler: (params, context) => Observable`: A function that takes validated params from callers and creates Observables that will be sent back to the caller.

- **`options.createContext$`: `(socket) => ObservableInput<Object>`**

  An *optional* function that is called when a new socket connects. It must return an `Observable`, a `Promise`, or an `Iterable` which will be converted into an `Observable`; the `context$`.

  The `context$` provides two major features:

    1. **authentication**: To authenticate connections, which you should probably be doing, return a `Promise` or an `Observable` from `createContext$` and do whatever async logic necessary to validate the `socket.request.headers`, or wait for additional messages using `socket.on()`. All method calls by the RPC client will be blocked until `context$` produces a value. If *at any time* `context$` emits an error or rejects, the error will be sent as the final message to the RPC connection and the connection will be destroyed.

    1. **socket specific arguments to methods**: The most recent value produced by the `context$` will be passed as the second argument to all methods called by this RPC client. This is how you can expose API clients, configuration, or functionality that is user specific to your router methods.

#### methods

- **`ObservableRpcRouter#close(): Promise`**

  Close the router and all active connections/subscriptions.
