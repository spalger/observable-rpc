const { parse } = require('eslint/lib/options')

const options = parse(process.argv)

if (!options._.length && !options.printConfig) {
  process.argv.push('.')
}

if (!process.argv.includes('--no-cache')) {
  process.argv.push('--cache')
}

require('eslint/bin/eslint')
