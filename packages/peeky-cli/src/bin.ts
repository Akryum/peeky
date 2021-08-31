#!/usr/bin/env node
import { Command } from 'commander'
import { open, run } from './index'

const program = new Command()
program.version(require('../package.json').version)

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
