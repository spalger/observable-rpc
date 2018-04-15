const { resolve } = require('path')
const execa = require('execa')
const Listr = require('listr')
const fs = require('fs-extra')

const tasks = new Listr([
  {
    title: 'Verify local repo',
    task: () =>
      new Listr(
        [
          {
            title: 'Checking git branch',
            task: () =>
              execa
                .stdout('git', ['rev-parse', '--abbrev-ref', 'HEAD'])
                .then(result => {
                  if (result.trim() !== 'master') {
                    throw new Error(
                      'Release should only be run from "master" branch.'
                    )
                  }
                }),
          },
          {
            title: 'Checking git status',
            task: () =>
              execa.stdout('git', ['status', '--porcelain']).then(result => {
                if (result !== '') {
                  throw new Error(
                    'Unclean working tree. Commit or stash changes first.'
                  )
                }
              }),
          },
          {
            title: 'Checking remote history',
            task: () =>
              execa
                .stdout('git', [
                  'rev-list',
                  '--count',
                  '--left-only',
                  '@{u}...HEAD',
                ])
                .then(result => {
                  if (result !== '0') {
                    throw new Error(
                      'Remote history differ. Please pull changes.'
                    )
                  }
                }),
          },
        ],
        { concurrent: true }
      ),
  },
  {
    title: 'Tests',
    task: () =>
      new Listr(
        [
          {
            title: 'Run eslint',
            task: () => execa('yarn', ['lint']),
          },
          {
            title: 'Run tests',
            task: () => execa('yarn', ['test']),
          },
        ],
        {
          concurrent: true,
        }
      ),
  },
  {
    title: 'Bump version',
    task: () =>
      new Listr([
        {
          title: 'Determine new version, generate changelogs',
          task: async (ctx, task) => {
            const { version: prevVersion } = await fs.readJson(
              require.resolve('../lerna.json')
            )

            await execa('lerna', [
              'publish',
              '--force-publish=*',
              '--skip-npm',
              '--skip-git',
              '--conventional-commits',
              '--yes',
            ])

            const { version } = await fs.readJson(
              require.resolve('../lerna.json')
            )
            ctx.version = version
            ctx.prevVersion = prevVersion
            task.output = `Bumped version from ${prevVersion} to ${version}`
          },
        },
        {
          title: 'Commit and tag',
          task: async ctx => {
            await execa('git', ['add', '-A'])
            await execa('git', ['commit', '-m', `v${ctx.version}`])
            await execa('git', ['tag', `v${ctx.version}`])
          },
        },
      ]),
  },
  {
    title: 'Push',
    skip: () => process.argv.includes('-n'),
    task: () =>
      new Listr([
        {
          title: 'Build code',
          task: () => execa('node', ['scripts/build']),
        },
        {
          title: 'Publish client to npm',
          skip: () => process.argv.includes('-n'),
          task: () =>
            execa('npm', ['publish'], {
              cwd: resolve(__dirname, '../projects/client'),
            }),
        },
        {
          title: 'Publish router to npm',
          skip: () => process.argv.includes('-n'),
          task: () =>
            execa('npm', ['publish'], {
              cwd: resolve(__dirname, '../projects/router'),
            }),
        },
        {
          title: 'Push branch to Github',
          skip: () => process.argv.includes('-n'),
          task: () => execa('git', ['push', 'origin', 'master']),
        },
        {
          title: 'Push tag to Github',
          skip: () => process.argv.includes('-n'),
          task: ctx => execa('git', ['push', 'origin', `v${ctx.version}`]),
        },
      ]),
  },
])

tasks.run().catch(error => {
  console.error(error)
  process.exit(1)
})
