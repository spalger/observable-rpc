import { Joi } from './joi'
import { validate } from './validate'

it('returns the validated data, including defaults from schema', () => {
  expect(validate({}, Joi.object().keys({ foo: Joi.default('bar') }))).toEqual({
    foo: 'bar',
  })
})

it('throws if input does not match schema', () => {
  expect(() => {
    validate({}, Joi.object({ foo: Joi.valid('bar').required() }))
  }).toThrowErrorMatchingSnapshot()
})

it('includes validation description if error message if supplied', () => {
  expect(() => {
    validate(
      {},
      Joi.object({ foo: Joi.valid('bar').required() }),
      'Foo validation'
    )
  }).toThrowErrorMatchingSnapshot()
})

it('throws a RpcError 401 error', () => {
  let thrown
  try {
    validate({}, Joi.object({ foo: Joi.valid('bar').required() }))
  } catch (error) {
    thrown = error
  }

  expect(thrown).toHaveProperty('isRpcError', true)
  expect(thrown).toHaveProperty('statusCode', 401)
})
