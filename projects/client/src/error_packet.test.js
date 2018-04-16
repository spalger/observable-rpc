import { errorPacketToError } from './error_packet'

describe('errorPacketToError', () => {
  it('converts Boom output to an error object as expected', () => {
    expect(
      errorPacketToError({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'You must specify a username and password',
        missing: ['username', 'password'],
      })
    ).toMatchSnapshot()
  })
})
