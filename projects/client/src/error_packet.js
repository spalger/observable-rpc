export const errorPacketToError = params => {
  const {
    statusCode = '?',
    error = 'Unknown Error',
    message = '',
    ...extraParams
  } = params

  return Object.assign(
    new Error(
      `RPC[${statusCode}:${error}]${
        message && message !== error ? ` - ${message}` : ''
      }`
    ),
    {
      statusCode,
      type: error,
      ...extraParams,
    }
  )
}
