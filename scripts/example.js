process.env.DEBUG = (process.env.DEBUG || '')
  .split(',')
  .concat('@rxrpc/router')
  .join(',')

require('source-map-support').install()
require('@babel/register')
require('../projects/example/run')
