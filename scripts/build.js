const { relative, resolve, extname } = require('path')
const { promisify } = require('util')
const { outputFile, remove, copy } = require('fs-extra')

const globby = require('globby')
const babel = require('@babel/core')

const asyncTransformFile = promisify(babel.transformFile)

const ROOT = resolve(__dirname, '..')
const DIRS = [
  resolve(ROOT, 'projects/client'),
  resolve(ROOT, 'projects/router'),
]

const dev = process.argv.includes('--dev')

async function run() {
  await Promise.all(
    DIRS.map(async DIR => {
      const name = relative(ROOT, DIR)
      await remove(resolve(DIR, 'dist'))

      const files = await globby(
        ['**/*', '!**/*.test.js', '!**/__snapshots__/**'],
        {
          dot: true,
          cwd: resolve(DIR, 'src'),
        }
      )

      await Promise.all(
        files.map(async file => {
          const source = resolve(DIR, 'src', file)
          const dest = resolve(DIR, 'dist', file)

          switch (extname(file)) {
            case '.js': {
              const { code } = await asyncTransformFile(source, {
                envName: dev ? 'development' : 'production',
                cwd: ROOT,
              })
              await outputFile(dest, code, 'utf8')
              break
            }

            default: {
              await copy(source, dest)
              break
            }
          }

          console.log(name, '->', file)
        })
      )

      console.log(name, '✅')
    })
  )
}

run().catch(error => {
  console.error('FATAL ERROR', error.stack)
  process.exit(1)
})
