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
