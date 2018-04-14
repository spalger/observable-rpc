export const errorResponseToError = params => {
  const {
    statusCode = '?',
    error = 'Unknown Error',
    message = '',
    ...extraParams
  } = params

  return Object.assign(new Error(`RPC[${statusCode}:${error}] - ${message}`), {
    statusCode,
    type: error,
    ...extraParams,
  })
}
