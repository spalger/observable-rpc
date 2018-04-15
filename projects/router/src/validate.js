import Boom from 'boom'

export function validate(toValidate, schema) {
  const { value, error } = schema.validate(toValidate, {
    abortEarly: false,
    stripUnknown: true,
  })

  if (error) {
    throw Boom.boomify(error, {
      statusCode: 401,
      message: 'Validation failure',
    })
  }

  return value
}
