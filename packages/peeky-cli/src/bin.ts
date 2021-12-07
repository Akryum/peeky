import fs from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { Command } from 'commander'
import { open, run } from './index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const { version } = JSON.parse(fs.readFileSync(resolve(__dirname, '../package.json'), 'utf8'))

const program = new Command('peeky')
program.version(version)

program.command('run')
  .description('run all tests, useful for continuous integration environments')
  .option('-m, --match <globs...>', 'Globs to match test files. Example: `peeky run -m "**/*.spec.ts" "**/__tests__/*.ts"`')
  .option('-i, --ignore <globs...>', 'Globs ignore when looking for test files. Example: `peeky run -i "node_modules" "dist/**/*.ts"`')
  .action(run)

program.command('open')
  .description('open a web interface to run and monitor tests')
  .option('-p, --port <port>', 'Listening port of the server')
  .action(open)

program.parse()
