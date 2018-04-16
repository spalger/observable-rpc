function applyOptions(error, options) {
  if (options.statusCode != null) {
    error.statusCode = options.statusCode
  }

  if (options.message) {
    error.message = error.message
      ? `${options.message}: ${error.message}`
      : options.message
  }

  if (options.props) {
    error.props = {
      ...(error.props || {}),
      ...options.props,
    }
  }

  return error
}

export class RpcError extends Error {
  static from(error, options = {}) {
    if (!(error instanceof Error)) {
      throw new TypeError('RpcError.from() requires an error')
    }

    if (!error.isRpcError) {
      return applyOptions(new RpcError(error), options)
    }

    if (options.override !== false) {
      applyOptions(error, options)
    }

    return error
  }

  static fromErrorPacket(packet) {
    if (typeof packet !== 'object') {
      return new RpcError({
        message: String(packet),
      })
    }

    return new RpcError(packet)
  }

  static badRequest(message, props) {
    return new RpcError({
      statusCode: 400,
      message,
      props,
    })
  }

  static notFound(message, props) {
    return new RpcError({
      statusCode: 404,
      message,
      props,
    })
  }

  constructor(options = {}) {
    if (typeof options === 'string') {
      options = {
        message: options,
      }
    }

    const { statusCode = 500, message, props } = options
    super(message)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = new Error().stack || ''
    }

    this.isRpcError = true
    this.statusCode = statusCode
    this.props = props
  }

  toJSON() {
    return this.toErrorPacket()
  }

  toErrorPacket() {
    return {
      statusCode: this.statusCode,
      message: this.message,
      props: this.props,
    }
  }
}
