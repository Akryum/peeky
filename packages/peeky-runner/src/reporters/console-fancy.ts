import consola from 'consola'
import chalk from 'chalk'
import { formatDurationToString } from '@peeky/utils'
import { Reporter } from '../types.js'

export function createConsoleFancyReporter (): Reporter {
  return {
    log: ({ type, text, suite, test }) => {
      consola.log(chalk.dim(`\n[${type}] ${test ? `${suite.title} › ${chalk.bold(test.title)}` : 'unknown test'}\n`))
      process[type].write(text)
      process[type].write('\n')
    },
    testSuccess: ({ suite, test }) => {
      consola.log(chalk.green(`${chalk.bgGreenBright.black.bold(' PASS ')} ${suite.title} › ${chalk.bold(test.title)} ${chalk.grey(`(${formatDurationToString(test.duration)})`)}`))
    },
    testFail: ({ suite, test }) => {
      consola.log(chalk.red(`${chalk.bgRedBright.black.bold(' FAIL ')} ${suite.title} › ${chalk.bold(test.title)} ${chalk.grey(`(${formatDurationToString(test.duration)})`)}`))
      consola.log(`\n${test.error.stack ?? test.error.message}\n`)
    },
  }
}
