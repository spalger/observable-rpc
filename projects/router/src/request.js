import { Joi } from './joi'
import { validate } from './validate'

const ReqSchema = Joi.object()
  .keys({
    id: Joi.alternatives()
      .try(Joi.string(), Joi.number())
      .required(),
    method: Joi.string().required(),
    params: Joi.any(),
  })
  .default()

export class Request {
  constructor(spec) {
    spec = validate(spec, ReqSchema)

    this.id = spec.id
    this.method = spec.method
    this.params = spec.params
  }
}
