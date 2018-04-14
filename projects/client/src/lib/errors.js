export const errorResponseToError = params => {
  const { message, ...extraParams } = params
  const error = new Error(
    `RPC[${params.statusCode || '?'}:${params.type || 'Error'}] - ${message ||
      'no message'}`
  )
  return Object.assign(error, extraParams)
}
