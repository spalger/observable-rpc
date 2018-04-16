import * as Rx from 'rxjs'

export class Logger {
  _subject = new Rx.Subject();
  [Rx.observable] = () => this._subject

  error(msg, props = {}) {
    this._subject.next({
      level: 'error',
      msg,
      props,
    })
  }

  info(msg, props = {}) {
    this._subject.next({
      level: 'info',
      msg,
      props,
    })
  }

  debug(msg, props = {}) {
    this._subject.next({
      level: 'debug',
      msg,
      props,
    })
  }
}
