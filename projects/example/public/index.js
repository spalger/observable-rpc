import * as Rx from 'rxjs'
import { ObservableRpcClient } from '@observable-rpc/client'
import { take, map, catchError } from 'rxjs/operators'

const client = new ObservableRpcClient({
  url: 'http://localhost:3000/rpc',
})

client
  .call('counter', { ms: 10, count: 100 })
  .pipe(take(10))
  .subscribe({
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

const sendInput = document.createElement('input')
sendInput.placeholder = 'Text to reverse server-side (max length 10)'
document.body.appendChild(sendInput)

const pingButton = document.createElement('button')
pingButton.innerText = 'Ping'
document.body.appendChild(pingButton)

const pongOutput = document.createElement('pre')
document.body.appendChild(pongOutput)

client
  .call(
    'reverse',
    Rx.fromEvent(pingButton, 'click').pipe(map(() => sendInput.value))
  )
  .pipe(
    catchError((error, resubscribe) =>
      Rx.concat([`ERROR: ${error.message}`], resubscribe)
    )
  )
  .subscribe({
    next(msg) {
      pongOutput.innerText += msg + '\n'
    },
  })
