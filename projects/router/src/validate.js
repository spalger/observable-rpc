import { RpcError } from '@observable-rpc/core'

export function validate(toValidate, schema, options = {}) {
  const { context, desc = 'Validation' } = options

  const { value, error } = schema.validate(toValidate, {
    abortEarly: false,
    stripUnknown: true,
    context,
  })

  if (error) {
    throw RpcError.from(error, {
      statusCode: 401,
      message: `${desc} failure`,
    })
  }

  return value
}
