import Boom from 'boom'

export function validate(toValidate, schema, description = 'Validation') {
  const { value, error } = schema.validate(toValidate, {
    abortEarly: false,
    stripUnknown: true,
  })

  if (error) {
    throw Boom.boomify(error, {
      statusCode: 401,
      message: `${description} failure`,
    })
  }

  return value
}
