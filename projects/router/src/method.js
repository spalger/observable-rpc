import * as Rx from 'rxjs'
import { Joi } from './joi'
import { validate } from './validate'

const SpecSchema = Joi.object()
  .keys({
    name: Joi.string().required(),
    validate: Joi.func().default(J => J.valid(undefined)),
    handler: Joi.func().required(),
  })
  .default()

export class Method {
  constructor(spec) {
    spec = validate(spec, SpecSchema)

    this._name = spec.name
    this._handler = spec.handler
    this._paramSchema = spec.validate(Joi)
  }

  getName() {
    return this._name
  }

  exec(req) {
    return Rx.defer(() => {
      const params = validate(req.params, this._paramSchema)
      return this._handler(params)
    })
  }
}
