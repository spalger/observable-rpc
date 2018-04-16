import { RpcError } from '@observable-rpc/core'

export function validate(toValidate, schema, description = 'Validation') {
  const { value, error } = schema.validate(toValidate, {
    abortEarly: false,
    stripUnknown: true,
  })

  if (error) {
    throw RpcError.from(error, {
      statusCode: 401,
      message: `${description} failure`,
    })
  }

  return value
}
