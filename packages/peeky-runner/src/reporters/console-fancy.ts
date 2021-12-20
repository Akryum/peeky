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

    errorSummary: ({ suites, errorTestCount, testCount }) => {
      consola.log(`\n\n${chalk.red(drawBox(`Summary of ${errorTestCount} / ${testCount} failed tests`, chalk.bold))}\n`)
      for (const suite of suites) {
        if (suite.testErrors) {
          for (const test of suite.tests) {
            if (test.error) {
              consola.log(chalk.red(`${chalk.bgRedBright.black.bold(' FAIL ')} ${suite.title} › ${chalk.bold(test.title)}`))
              consola.log(`\n${test.error.stack ?? test.error.message}\n`)
            }
          }
        }
      }
    },

    coverageSummary: ({
      uncoveredFiles,
      partiallyCoveredFiles,
      mergedCoverage,
      coveredFilesCount,
      coveredLines,
      totalLines,
    }) => {
      const header = [
        'Coverage',
        `${coveredFilesCount}/${mergedCoverage.length} files (${
          Math.round(coveredFilesCount / Math.max(1, mergedCoverage.length) * 10000) / 100
        }%)`,
        `${coveredLines}/${totalLines} lines (${
          Math.round(coveredLines / Math.max(1, totalLines) * 10000) / 100
        }%)`,
      ]
      const noCoverage = coveredFilesCount === 0 && mergedCoverage.length > 0
      const headerColor = chalk[noCoverage ? 'red' : coveredLines === totalLines ? 'green' : 'yellow']
      const fileCountColor = chalk[noCoverage ? 'red' : coveredFilesCount === mergedCoverage.length ? 'green' : 'yellow']
      const headerSeparator = '   '
      consola.log(`\n\n${headerColor(drawBox(header.join(headerSeparator), () => chalk.bold([
        header[0],
        fileCountColor(header[1]),
        header[2],
      ].join(headerSeparator))))}\n`)

      const maxFiles = 5

      if (uncoveredFiles.length > 0) {
        consola.log(chalk.red(`No coverage in ${uncoveredFiles.length} files\n${chalk.dim(`${uncoveredFiles.slice(0, maxFiles).map(c => `  ${c.path}`).join('\n')}${uncoveredFiles.length > maxFiles ? '\n  ...' : ''}`)}\n`))
      }
      if (partiallyCoveredFiles.length > 0) {
        consola.log(chalk.yellow(`Partial coverage in ${partiallyCoveredFiles.length} files\n${chalk.dim(`${
          partiallyCoveredFiles.slice(0, maxFiles).map(c => `  ${c.path}   ${c.linesCovered}/${c.linesTotal} lines (${
            Math.round(c.linesCovered / c.linesTotal * 10000) / 100
          }%)`).join('\n')
        }${partiallyCoveredFiles.length > maxFiles ? '\n  ...' : ''}`)}\n`))
      }
    },

    summary: ({
      fileCount,
      duration,
      suiteCount,
      errorSuiteCount,
      testCount,
      errorTestCount,
    }) => {
      consola.log(`${drawBox(`Ran ${fileCount} tests files (${formatDurationToString(duration)})`)}\n`)
      consola.log(chalk[errorSuiteCount ? 'red' : 'green'](`  ${chalk.dim('Suites')} ${chalk.bold(`${suiteCount - errorSuiteCount} / ${suiteCount}`)}\n   ${chalk.dim('Tests')} ${chalk.bold(`${testCount - errorTestCount} / ${testCount}`)}\n  ${chalk.dim('Errors')} ${chalk.bold(errorTestCount)}\n`))
    },
  }
}

function drawBox (text: string, format?: (text: string) => string) {
  let result = `┌${'─'.repeat(text.length + 2)}┐\n`
  result += `│ ${format ? format(text) : text} │\n`
  result += `└${'─'.repeat(text.length + 2)}┘`
  return result
}
