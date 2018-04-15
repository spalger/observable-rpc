# `@observable-rpc`

Basic RPC implementation for browser -> node.js RPC calls that expose Observables
on both ends.

Use the `@observable-rpc/router` package to add the websocket server to your server.

Use the `@observable-rpc/client` pacakge to call the RPC methods from the browser.

## Quick start

Install the packages in your project
```sh
npm install @observable-rpc/router @observable-rpc-client
```

Instantiate the router within your server:

```js
import { createServer } from 'http'

import * as Rx from 'rxjs'
import { createRpcRouter } from '@observable-rpc/router'

const server = createServer((req, resp) => {
  resp.end('hello world')
})

const router = createRpcRouter({
  server,
  methods: [
    {
      name: 'foo',
      // return value of handler() must be an iterable, promise, or Observable
      handler: () => ['bar'],
    },
    {
      name: 'interval',
      // use Joi schemas to validate params passed to this method, See https://github.com/hapijs/joi/
      validate: (Joi) => Joi.object().keys({
        ms: Joi.number().min(100).required(),
        count: Joi.number().default(10)
      }).default(),
      handler: ({ ms, count }) => (
        Rx.Observable.interval(ms).take(count)
      )
    }
  ]
})

server.listen(3000)
```

Call the methods from the browser:

```js
import { createRpcClient } from '@observable-rpc/client'

const client = createRpcClient('http://localhost:3000/rpc')

client.get('interval', { ms: 10, count: 100 }).subscribe({
  next(value) {
    console.log('interval:next', value)
  },
  error(error) {
    console.log('interval:error', error)
  },
  complete() {
    console.log('interval:complete')
  },
})
```
