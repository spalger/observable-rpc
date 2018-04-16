const { relative, resolve, extname } = require('path')
const { promisify } = require('util')
const { outputFile, remove, copy } = require('fs-extra')

const chalk = require('chalk')
const Rx = require('rxjs')
const chokidar = require('chokidar')
const {
  concatMap,
  groupBy,
  filter,
  debounceTime,
  mergeMap,
  mergeAll,
} = require('rxjs/operators')
const globby = require('globby')
const babel = require('@babel/core')

const asyncTransformFile = promisify(babel.transformFile)

const ROOT = resolve(__dirname, '..')
const DIRS = [
  resolve(ROOT, 'projects/client'),
  resolve(ROOT, 'projects/core'),
  resolve(ROOT, 'projects/router'),
]

const BUILD_FILES = ['**/*', '!**/*.test.js', '!**/__snapshots__/**']

const dev = process.argv.includes('--dev')

function createFile$(dir) {
  if (!dev) {
    // get the files once with globby if not in dev mode
    return Rx.defer(async () => {
      const paths = await globby(BUILD_FILES, {
        dot: true,
        cwd: resolve(dir, 'src'),
      })

      return paths.map(path => ({ path }))
    }).pipe(mergeAll())
  }

  // get and watch the files in dev mode
  return Rx.Observable.create(observer => {
    const watcher = chokidar.watch(BUILD_FILES, {
      persistent: true,
      cwd: resolve(dir, 'src'),
    })

    watcher
      .on('add', path => {
        observer.next({ path })
      })
      .on('change', path => {
        observer.next({ path })
      })
      .on('unlink', path => {
        observer.next({ path, remove: true })
      })

    return () => {
      watcher.close()
    }
  })
}

function isBabelError(error) {
  return error.code && error.code.startsWith('BABEL_')
}

async function run() {
  await Promise.all(
    DIRS.map(async dir => {
      const name = relative(ROOT, dir)
      await remove(resolve(dir, 'dist'))

      await createFile$(dir)
        .pipe(
          // group files by path, so that operations on the same path can be done in series by concatMap()
          groupBy(f => f.path, null, group$ =>
            Rx.race(
              group$.pipe(filter(f => f.remove)),
              group$.pipe(debounceTime(10000))
            )
          ),

          // operate on each group in parallel, but items within each group in series
          mergeMap(group$ =>
            group$.pipe(
              concatMap(async f => {
                const source = resolve(dir, 'src', f.path)
                const dest = resolve(dir, 'dist', f.path)

                // delete the file from the destination
                if (f.remove) {
                  await remove(dest)
                  console.log(chalk`{dim ${name}: removed ${f.path}}`)
                  return
                }

                switch (extname(source)) {
                  // transpile js files with babel before writing to destination
                  case '.js': {
                    try {
                      const { code } = await asyncTransformFile(source, {
                        envName: dev ? 'development' : 'production',
                        sourceMaps: dev ? 'inline' : false,
                        cwd: ROOT,
                        highlightCode: true,
                      })
                      await outputFile(dest, code, 'utf8')
                    } catch (error) {
                      if (isBabelError(error)) {
                        console.log(
                          chalk`{dim ${name}:} {bold.red error} ${f.path}`
                        )
                        console.log(error.message)
                      }

                      if (!dev) {
                        throw error
                      }
                    }
                    break
                  }

                  // copy all other files to destination
                  default: {
                    await copy(source, dest)
                    break
                  }
                }

                console.log(chalk`{dim ${name}:} ${f.path}`)
              })
            )
          )
        )
        .toPromise()
    })
  )
}

run().catch(error => {
  if (!isBabelError(error)) {
    console.error('FATAL ERROR', error.stack)
  }

  process.exit(1)
})
