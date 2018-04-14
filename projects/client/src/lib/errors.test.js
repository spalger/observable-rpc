import { errorResponseToError } from './errors'

describe('errorResponseToError', () => {
  it('converts Boom output to an error object as expected', () => {
    expect(
      errorResponseToError({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'You must specify a username and password',
        missing: ['username', 'password'],
      })
    ).toMatchSnapshot()
  })
})
