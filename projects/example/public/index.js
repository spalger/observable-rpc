import { ObservableRpcClient } from '@observable-rpc/client'

const client = new ObservableRpcClient({
  url: 'http://localhost:3000/rpc',
})

client.call('interval', { ms: 10, count: 100 }).subscribe({
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
