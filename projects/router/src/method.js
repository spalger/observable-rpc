import * as Rx from 'rxjs'
import { map } from 'rxjs/operators'
import { receive } from '@observable-rpc/core'

import { Joi } from './joi'
import { validate } from './validate'

const ParamJoi = Joi.extend([
  {
    name: 'observable',
    language: {
      invalid: 'must be an observable',
    },
    pre(value, state, options) {
      if (typeof value !== 'string' || !value.startsWith('observable:')) {
        return this.createError('observable.invalid', null, state, options)
      }

      const itemSchema = this._flags.itemSchema
      const name = state.path.concat(state.key).join('.')
      const socket = options.context.socket
      const subId = `${options.context.subId}.${value.split(':')[1]}`

      return Rx.defer(() => {
        socket.emit(`rpc:sub:${subId}`)
        return receive(socket, subId).pipe(
          map(value => {
            if (!itemSchema) {
              return value
            }

            return validate(value, itemSchema, {
              desc: `${name} param validation`,
            })
          })
        )
      })
    },
    rules: [
      {
        name: 'items',
        params: { schema: Joi.object() },
        setup({ schema }) {
          if (!schema.isJoi) {
            throw new TypeError(
              'Joi.observable().items(schema) takes a Joi schema as its only argument'
            )
          }

          this._flags.itemSchema = schema
        },
      },
    ],
  },
])

const SpecSchema = Joi.object()
  .keys({
    name: Joi.string().required(),
    validate: Joi.func().default(J => J.forbidden()),
    handler: Joi.func().required(),
  })
  .default()

export class Method {
  constructor(spec) {
    spec = validate(spec, SpecSchema, {
      desc: 'Method validation',
    })

    this._name = spec.name
    this._handler = spec.handler
    this._paramSchema = spec.validate(ParamJoi)
  }

  getName() {
    return this._name
  }

  validateParams(params, socket, subId) {
    return validate(params, this._paramSchema, {
      desc: 'Param validation',
      context: {
        socket,
        subId,
      },
    })
  }

  call(params, context) {
    return this._handler(params, context)
  }
}
