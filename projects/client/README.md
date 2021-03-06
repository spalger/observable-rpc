# `@observable-rpc/client`

Creates a router that accepts WebSocket requests for methods to be run on the server.

Use the `@observable-rpc/router` package to determine what methods will be exposed to the browser.

## API

### `ObservableRpcClient(url)`

```js
import { ObservableRpcClient } from '@observable-rpc/client'
const client = new ObservableRpcClient(options)
```

Wraps a Socket.IO client to send requests to the server and handle responses.

#### options
- **`options.url`: `String`**

  The protocol+hostname+port+path the `ObservableRpcClient` should use to talk to the `ObservableRpcRouter`. When run in the browser this will default to the current protocol+host+port and the path `/rpc`.

- **`options.consumeLog$`: `(log$) => void`**

  By default log messages from `ObservableRpcRouter` are handled with [`debug`](https://www.npmjs.com/package/debug). Pass a consumeLog$ function to receive a stream of log events to handle them yourself. Log events have the following properties:

  - `level: 'error'|'info'|'debug'`: The level for the log message

  - `msg: String`: The log message, probably pretty short

  - `data: any`: Metadata relevant to the specific log message

#### methods
- **`ObservableRpcClient#call(method, params): Observable`**

  Call a method on the server. Returns an `Observable` (from RxJS 6) that mirrors the values/errors/completion of the observable from the server
