/* eslint-disable no-console */

const childProcess = require('child_process')
const { readdir } = require('fs')
const readline = require('readline')
const { resolve } = require('path')

const Rx = require('rxjs')
const {
  takeUntil,
  mergeAll,
  filter,
  map,
  shareReplay,
  mergeMap,
  reduce,
  merge,
  tap,
  first,
} = require('rxjs/operators')

const chalk = require('chalk')

const PROJECT_DIR = resolve(__dirname, '../projects')
const COMMAND = process.argv[2]

const colors = [
  'deeppink',
  'deepskyblue',
  'mediumslateblue',
  'greenyellow',
  'gold',
  'hotpink',
  'cyan',
  'lime',
]

const procs = new Set()
const exec = (cmd, options) => {
  const proc = childProcess.spawn(cmd, options)
  procs.add(proc)
  proc.once('exit', () => procs.delete(proc))
  return proc
}

process.on('SIGINT', () => {
  for (const proc of procs) {
    proc.kill('SIGINT')
  }
})

process.on('exit', () => {
  for (const proc of procs) {
    proc.kill('SIGKILL')
  }
})

const readableLines = str =>
  new Rx.Observable(observer => {
    const i = readline.createInterface({
      input: str,
      crlfDelay: Infinity,
    })

    return Rx.fromEvent(i, 'line')
      .pipe(takeUntil(Rx.fromEvent(i, 'close')))
      .subscribe(observer)
  })

const project$ = Rx.bindNodeCallback(readdir)(PROJECT_DIR).pipe(
  mergeAll(),
  filter(name => !name.startsWith('.')),
  map(name => ({
    name,
    pkg: require(resolve(PROJECT_DIR, name, 'package.json')),
    path: resolve(PROJECT_DIR, name),
  })),
  filter(project => {
    if (!COMMAND) {
      throw new Error('specify the command to run')
    }

    if (COMMAND === 'install') {
      return true
    }

    return project.pkg.scripts && project.pkg.scripts[COMMAND]
  }),
  shareReplay()
)

project$
  .pipe(
    mergeMap(async project => {
      const cmd = COMMAND === 'install' ? 'yarn' : 'yarn run ' + COMMAND

      const proc = exec(cmd, {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: project.path,
        shell: true,
      })

      const color = colors.shift()
      colors.push(color)

      const width = await project$
        .pipe(reduce((max, p) => Math.max(max, p.name.length), 0))
        .toPromise()

      const nameWidth = project.name.length
      const indentWidth = width - nameWidth
      const indent = indentWidth > 0 ? ' '.repeat(indentWidth) : ''
      const label = chalk.keyword(color)(` ${indent}${project.name}`)

      const [exitCode] = await Promise.all([
        Rx.race(
          Rx.fromEvent(proc, 'exit').pipe(
            map(([exitCode]) => exitCode),
            first()
          ),
          Rx.fromEvent(proc, 'error').pipe(mergeMap(Rx.throw))
        ).toPromise(),

        readableLines(proc.stdout)
          .pipe(
            merge(readableLines(proc.stderr)),
            tap(line => {
              console.log(label, line)
            })
          )
          .toPromise(),
      ])

      if (exitCode > 0) {
        console.log(label, '🚫 exitted with status code', exitCode)
        process.exit(exitCode)
      } else {
        console.log(label, '✅')
      }
    })
  )
  .toPromise()
  .catch(error => {
    console.error('FATAL ERROR', error.stack)
  })
