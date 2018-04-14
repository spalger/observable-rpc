const execa = require('execa')
const chalk = require('chalk')
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

    return project.pkg.scripts && project.pkg.scripts[COMMAND]
  }),
  shareReplay()
)

project$
  .pipe(
    mergeMap(async project => {
      const proc = execa('yarn', ['run', COMMAND], {
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: project.path,
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
    process.exit(1)
  })
