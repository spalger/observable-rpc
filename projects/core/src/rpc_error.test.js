import { RpcError } from './rpc_error'

describe('RpcError.from(value, options)', () => {
  describe('value type check', () => {
    it('throws if value is a number', () => {
      expect(() => RpcError.from(1)).toThrowError(
        'RpcError.from() requires an error'
      )
    })
    it('throws if value is a regex', () => {
      expect(() => RpcError.from(/a/)).toThrowError(
        'RpcError.from() requires an error'
      )
    })
    it('throws if value is a string', () => {
      expect(() => RpcError.from('foo bar')).toThrowError(
        'RpcError.from() requires an error'
      )
    })
    it('throws if value is an array', () => {
      expect(() => RpcError.from(['foo', 'bar'])).toThrowError(
        'RpcError.from() requires an error'
      )
    })
    it('throws if value is an function', () => {
      expect(() => RpcError.from(() => {})).toThrowError(
        'RpcError.from() requires an error'
      )
    })
    it('does not throw if value is an Error', () => {
      RpcError.from(new Error())
    })
  })

  it('returns RpcErrors that are passed in', () => {
    const error = new RpcError({
      statusCode: 404,
      message: 'foo bar',
      props: {
        foo: 'bar',
      },
    })

    expect(RpcError.from(error)).toBe(error)
  })

  it('converts non-RpcError to RpcError instance', () => {
    const error = new Error('foo bar')
    const rpcError = RpcError.from(error)

    expect(error).not.toBe(rpcError)
    expect(rpcError).toHaveProperty('isRpcError', true)
    expect(rpcError).toHaveProperty('message', 'foo bar')
    expect(rpcError).toHaveProperty('props', undefined)
    expect(rpcError).toHaveProperty('statusCode', 500)
  })

  it('overrides/extends properties when override is not sent', () => {
    const orig = new RpcError({
      statusCode: 400,
      message: 'foo',
      props: { foo: true },
    })

    const rpcError = RpcError.from(orig, {
      statusCode: 500,
      message: 'bar',
      props: { bar: true },
    })

    expect(orig).toBe(rpcError)
    expect(rpcError).toHaveProperty('isRpcError', true)
    expect(rpcError).toHaveProperty('message', 'bar: foo')
    expect(rpcError).toHaveProperty('props')
    expect(rpcError.props).toEqual({ bar: true, foo: true })
    expect(rpcError).toHaveProperty('statusCode', 500)
  })

  it('ignores options when override === false', () => {
    const orig = new RpcError({
      statusCode: 400,
      message: 'foo',
      props: { foo: true },
    })

    const rpcError = RpcError.from(orig, {
      statusCode: 500,
      message: 'bar',
      props: { bar: true },
      override: false,
    })

    expect(orig).toBe(rpcError)
    expect(rpcError).toHaveProperty('isRpcError', true)
    expect(rpcError).toHaveProperty('message', 'foo')
    expect(rpcError).toHaveProperty('props', { foo: true })
    expect(rpcError).toHaveProperty('statusCode', 400)
  })
})

describe('RpcError.fromErrorPacket()', () => {
  it('creates instance of RpcError from string', () => {
    const rpcError = RpcError.fromErrorPacket('error message')

    expect(rpcError).toHaveProperty('isRpcError', true)
    expect(rpcError).toHaveProperty('message', 'error message')
    expect(rpcError).toHaveProperty('props', undefined)
    expect(rpcError).toHaveProperty('statusCode', 500)
  })

  it('creates instance of RpcError from number', () => {
    const rpcError = RpcError.fromErrorPacket(400)

    expect(rpcError).toHaveProperty('isRpcError', true)
    expect(rpcError).toHaveProperty('message', '400')
    expect(rpcError).toHaveProperty('props', undefined)
    expect(rpcError).toHaveProperty('statusCode', 500)
  })

  it('creates instance of RpcError with properties from object', () => {
    const rpcError = RpcError.fromErrorPacket({
      message: 'foo',
      statusCode: 409,
      props: {
        foo: true,
      },
    })

    expect(rpcError).toHaveProperty('isRpcError', true)
    expect(rpcError).toHaveProperty('message', 'foo')
    expect(rpcError).toHaveProperty('props', { foo: true })
    expect(rpcError).toHaveProperty('statusCode', 409)
  })
})

describe('RpcError constructor', () => {
  it('uses message if passed a string', () => {
    const rpcError = new RpcError('foo')
    expect(rpcError).toHaveProperty('message', 'foo')
    expect(rpcError).toHaveProperty('props', undefined)
    expect(rpcError).toHaveProperty('statusCode', 500)
  })

  it('uses message, statusCode, and props if passed as options', () => {
    const rpcError = new RpcError({
      message: 'foo',
      statusCode: 501,
      props: {
        foo: 'bar',
      },
    })

    expect(rpcError).toHaveProperty('message', 'foo')
    expect(rpcError).toHaveProperty('props', { foo: 'bar' })
    expect(rpcError).toHaveProperty('statusCode', 501)
  })

  it('supports null statusCode', () => {
    const rpcError = new RpcError({
      message: 'foo',
      statusCode: null,
    })

    expect(rpcError).toHaveProperty('message', 'foo')
    expect(rpcError).toHaveProperty('props', undefined)
    expect(rpcError).toHaveProperty('statusCode', null)
  })
})

describe('RpcError#toErrorPacket()', () => {
  it('returns a pojo with statusCode, message, and props', () => {
    const rpcError = new RpcError({
      message: 'foo bar',
      statusCode: 501,
      props: {
        foo: 'bar',
      },
    })

    const packet = rpcError.toErrorPacket()
    expect(Object.prototype.toString.call(packet)).toBe('[object Object]')
    expect(packet).toEqual({
      message: 'foo bar',
      statusCode: 501,
      props: {
        foo: 'bar',
      },
    })
  })
})
