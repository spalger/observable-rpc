# `@observable-rpc/router`

Creates a router that accepts websocket requests for methods to be run on the server.

Use the `@observable-rpc/client` package to call to the router from the browser.

## API

### `ObservableRpcRouter(options)`

```js
import { ObservableRpcRouter } from '@observable-rpc/router'
const router = new ObservableRpcRouter(options)
```

Wraps a Socket.IO websocket server and maps requests from clients to methods.

#### options
- **`options.server`: `HttpServer`**

  A server from the `http` or `https` module

- **`options.path`: `String`**

  Default: `/rpc`. The path on your server where the `ObservableRpcClient` will mount itself and handle requests.

- **`options.log`: `(level, msg, data) => void`**

  By default log messages from `ObservableRpcRouter` are handled with [`debug`](https://www.npmjs.com/package/debug). Pass a log function to handle them yourself.

- **`options.methods`: `Array<MethodSpec>`**

  An array of methods to expose for RPC. Each `MethodSpec` should be an object that has the following properties:

    `name: String`: The name that clients will use to call this method

    `validate: (Joi) => JoiSchema`: A function to generate a [Joi](https://github.com/hapijs/joi) schema that will be used to validate params sent from callers.

    `handler: (params) => Observable`: A function that takes validated params from callers and creates Observables that will be sent back to the caller.

#### methods

- **`ObservableRpcRouter#close(): Promise`**

  Close the router and all active connections/subscriptions.
