import consola from 'consola'
import chalk from 'chalk'
import { diffStringsUnified } from 'jest-diff'
import { formatDurationToString } from '@peeky/utils'
import type { Reporter, ReporterTestSuite } from '../types.js'

export function createConsoleFancyReporter (): Reporter {
  return {
    log: ({ type, text, suite, test, file }) => {
      consola.log(chalk.dim(`\n${chalk.bgGray.white(` ${type} `)} ${test ? `${suite.title} › ${chalk.bold(test.title)}` : file ?? 'unknown test'}\n`))
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

      const eachSuite = (suite: ReporterTestSuite) => {
        if (suite.testErrors) {
          for (const child of suite.children) {
            if (child[0] === 'suite') {
              eachSuite(child[1])
            } else if (child[0] === 'test') {
              const test = child[1]
              if (test.error) {
                consola.log(chalk.red(`${chalk.bgRedBright.black.bold(' FAIL ')} ${suite.title} › ${chalk.bold(test.title)}`))
                consola.log(`\n${test.error.stack ?? test.error.message}\n`)
              }
            }
          }
        }
      }

      for (const suite of suites) {
        eachSuite(suite)
      }
    },

    snapshotSummary: ({ snapshotCount, failedSnapshots }) => {
      consola.log(`\n\n${chalk.red(drawBox(`${failedSnapshots.length} / ${snapshotCount} failed snapshots`, chalk.bold))}\n`)

      for (const snapshot of failedSnapshots) {
        consola.log(chalk.red(`${chalk.bgRedBright.black.bold(' FAIL ')} ${chalk.bold(snapshot.title)}`))
        consola.log(`\n${diffStringsUnified(snapshot.newContent, snapshot.content)}\n${snapshot.error.stack}\n`)
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
      if (!mergedCoverage.length) return
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
      snapshotCount,
      failedSnapshotCount,
      updatedSnapshotCount,
      newSnapshotCount,
    }) => {
      consola.log(`\n${drawBox(`Ran ${fileCount} tests files (${formatDurationToString(duration)})`)}\n`)

      let snapshotSummary = `${snapshotCount - failedSnapshotCount} / ${snapshotCount}`
      const snapshotDetails: string[] = []
      if (failedSnapshotCount) {
        snapshotDetails.push(`failed: ${failedSnapshotCount}`)
      }
      if (updatedSnapshotCount) {
        snapshotDetails.push(`updated: ${updatedSnapshotCount}`)
      }
      if (newSnapshotCount) {
        snapshotDetails.push(`new: ${newSnapshotCount}`)
      }
      if (snapshotDetails.length) {
        snapshotSummary += ` (${snapshotDetails.join(', ')})`
      }

      const stats = [
        ['Suites', `${suiteCount - errorSuiteCount} / ${suiteCount}`],
        ['Tests', `${testCount - errorTestCount} / ${testCount}`],
        ['Snapshots', snapshotSummary],
        ['Errors', `${errorTestCount}`],
      ]
      const colSize = Math.max(...stats.map(([label]) => label.length)) + 2
      consola.log(chalk[errorSuiteCount ? 'red' : 'green'](stats.map(t => `${chalk.dim(t[0].padStart(colSize, ' '))} ${chalk.bold(t[1])}\n`).join('')))
    },
  }
}

function drawBox (text: string, format?: (text: string) => string) {
  let result = `┌${'─'.repeat(text.length + 2)}┐\n`
  result += `│ ${format ? format(text) : text} │\n`
  result += `└${'─'.repeat(text.length + 2)}┘`
  return result
}
