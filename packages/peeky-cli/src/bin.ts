import fs from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import sade from 'sade'

const __dirname = dirname(fileURLToPath(import.meta.url))

const { version } = JSON.parse(fs.readFileSync(resolve(__dirname, '../package.json'), 'utf8'))

const program = sade('peeky')
program.version(version)

program.command('run')
  .describe('run all tests, useful for continuous integration environments')
  .option('-m, --match <globs...>', 'Globs to match test files. Example: `peeky run -m "**/*.spec.ts" "**/__tests__/*.ts"`')
  .option('-i, --ignore <globs...>', 'Globs ignore when looking for test files. Example: `peeky run -i "node_modules" "dist/**/*.ts"`')
  .action(async (options) => {
    const { run } = await import('./commands/run.js')
    return run(options)
  })

program.command('open')
  .describe('open a web interface to run and monitor tests')
  .option('-p, --port <port>', 'Listening port of the server')
  .action(async (options) => {
    const { open } = await import('./commands/open.js')
    return open(options)
  })

program.parse(process.argv)
