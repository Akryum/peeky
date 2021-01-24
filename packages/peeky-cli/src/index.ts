#!/usr/bin/env node
import { Command } from 'commander'
import { setupConfigLoader, mergeConfig, PeekyConfig } from '@peeky/config'
import { runAllTests } from '@peeky/runner'
import { createServer } from '@peeky/server'
import { pick } from 'lodash'
import consola from 'consola'
import open from 'open'
import { ensureESBuildService } from '@peeky/utils'

const program = new Command()
program.version(require('../package.json').version)

program.command('run')
  .description('run all tests, useful for continuous integration environments')
  .option('-m, --match <globs...>', 'Globs to match test files. Example: `peeky run -m "**/*.spec.ts" "**/__tests__/*.ts"`')
  .option('-i, --ignore <globs...>', 'Globs ignore when looking for test files. Example: `peeky run -i "node_modules" "dist/**/*.ts"`')
  .action(async (options) => {
    try {
      await ensureESBuildService()
      const configLoader = await setupConfigLoader()
      const config = await configLoader.loadConfig(false)
      await configLoader.destroy()
      const finalConfig = mergeConfig(config, (pick<any>(options, [
        'match',
        'ignore',
      ]) as PeekyConfig))

      const { stats: { errorSuiteCount } } = await runAllTests(finalConfig)

      if (errorSuiteCount) {
        const e = new Error('Some tests failed')
        e.stack = e.message
        throw e
      }
    } catch (e) {
      consola.error(e)
      process.exit(1)
    }
  })

program.command('open')
  .description('open a web interface to run and monitor tests')
  .action(async () => {
    try {
      await ensureESBuildService()
      const {
        http,
      } = await createServer()
      const port = process.env.PORT || 4000
      http.listen(port, () => {
        const url = `http://localhost:${port}`
        consola.success(`🚀 Server ready at ${url}`)
        open(url)
      })
    } catch (e) {
      consola.error(e)
      process.exit(1)
    }
  })

program.parse()
