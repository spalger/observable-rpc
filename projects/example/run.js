import { resolve } from 'path'
import { createServer } from 'http'

import webpack from 'webpack'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import middleware from 'webpack-dev-middleware'
import express from 'express'
import { ObservableRpcRouter } from '@observable-rpc/router'
import * as Rx from 'rxjs'
import { take } from 'rxjs/operators'

const app = express()
const server = createServer(app)
new ObservableRpcRouter({
  server,
  methods: [
    {
      name: 'interval',
      validate(Joi) {
        return Joi.object()
          .keys({
            ms: Joi.number().required(),
            count: Joi.number().default(10),
          })
          .default()
      },
      handler({ ms, count }) {
        return Rx.interval(ms).pipe(take(count))
      },
    },
  ],
})

app.use(
  middleware(
    webpack({
      mode: 'development',
      context: resolve(__dirname, 'public'),
      entry: './index',
      plugins: [new HtmlWebpackPlugin()],
    })
  )
)

process
  .listeners('SIGTERM')
  .slice(1)
  .forEach(listener => {
    process.removeListener('SIGTERM', listener)
  })

server.listen(3000, () =>
  console.log('server listening at http://localhost:3000')
)
