# `@observable-rpc`

Basic RPC implementation for browser -> node.js RPC calls that expose Observables
on both ends.

Use the [`@observable-rpc/router`](./projects/router/README.md) package to add the router to your server.

Use the [`@observable-rpc/client`](./projects/client/README.md) package to call to the router from the browser.

## quick start

Install the packages in your project:

```sh
npm install @observable-rpc/router @observable-rpc-client
```

Instantiate the router with your server:

```js
import { createServer } from 'http'

import * as Rx from 'rxjs'
import { ObservableRpcRouter } from '@observable-rpc/router'

const server = createServer((req, resp) => {
  resp.end('hello world')
})

const router = new ObservableRpcRouter({
  server,
  methods: [
    {
      name: 'foo',
      // return value of handler() must be an iterable, promise, or Observable
      handler: () => ['bar'],
    },
    {
      name: 'counter',
      // use Joi schemas to validate params passed to this method, See https://github.com/hapijs/joi/
      validate: (Joi) => Joi.object().keys({
        ms: Joi.number().default(100),
        limit: Joi.number().default(10)
      }).default(),
      handler: ({ ms, limit }) => (
        Rx.Observable.interval(ms).take(limit)
      )
    }
  ]
})

server.listen(3000)
```

Call the methods from the browser:

```js
import { ObservableRpcClient } from '@observable-rpc/client'

const client = ObservableRpcClient('http://localhost:3000/rpc')

client.get('counter', { ms: 100 }).subscribe({
  next(value) {
    console.log('counter:next', value)
  },
  error(error) {
    console.log('counter:error', error)
  },
  complete() {
    console.log('counter:complete')
  },
})
```
