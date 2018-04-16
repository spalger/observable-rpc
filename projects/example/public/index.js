import * as Rx from 'rxjs'
import { ObservableRpcClient } from '@observable-rpc/client'
import { tap, take, map, catchError } from 'rxjs/operators'

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

const form = document.createElement('form')
document.body.appendChild(form)

const input = document.createElement('input')
input.placeholder = 'Text to reverse server-side (max length 10)'
form.appendChild(input)

const submit = document.createElement('button')
submit.innerText = 'Ping'
form.appendChild(submit)

const pongOutput = document.createElement('pre')
document.body.appendChild(pongOutput)

client
  .call(
    'reverse',
    Rx.fromEvent(form, 'submit').pipe(
      tap(e => e.preventDefault()),
      map(() => input.value)
    )
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
