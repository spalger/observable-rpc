import * as Rx from 'rxjs'

export class Logger {
  _subject = new Rx.Subject();
  [Rx.observable] = () => this._subject

  error(msg, data) {
    this._subject.next({
      level: 'error',
      msg,
      data,
    })
  }

  info(msg, data) {
    this._subject.next({
      level: 'info',
      msg,
      data,
    })
  }

  debug(msg, data) {
    this._subject.next({
      level: 'debug',
      msg,
      data,
    })
  }
}
