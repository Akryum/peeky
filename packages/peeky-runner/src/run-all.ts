import { performance } from 'perf_hooks'
import consola from 'consola'
import chalk from 'chalk'
import { createReactiveFileSystem } from 'reactive-fs'
import { ProgramPeekyConfig } from '@peeky/config'
import { formatDurationToString } from '@peeky/utils'
import { setupRunner } from './runner.js'
import { getStats } from './stats.js'
import { computeCoveredLines, getEmptyCoverageFromFiles, mergeCoverage } from './runtime/coverage.js'

export interface RunAllOptions {
  quickTestFilter?: string
}

export async function runAllTests (config: ProgramPeekyConfig, options: RunAllOptions = {}) {
  const fsTime = performance.now()
  const testFiles = await createReactiveFileSystem({
    baseDir: config.targetDirectory,
    glob: config.match,
    ignored: config.ignored,
  })

  const runner = await setupRunner({
    config,
    testFiles,
  })

  let fileList = runner.testFiles.list()

  if (options.quickTestFilter) {
    const reg = new RegExp(options.quickTestFilter, 'i')
    fileList = fileList.filter(f => reg.test(f))
  }

  consola.info(`Found ${fileList.length} test files in ${formatDurationToString(performance.now() - fsTime)}.`)

  const time = performance.now()
  const result = await Promise.all(fileList.map(f => runner.runTestFile(f)))
  const endTime = performance.now()

  const stats = getStats(result)
  const {
    suiteCount,
    errorSuiteCount,
    testCount,
    errorTestCount,
  } = stats

  // Error summary
  if (errorTestCount) {
    console.log('―'.repeat(16))
    consola.log(chalk.red.bold(`Errors: ${errorTestCount} / ${testCount} tests`))
    console.log('―'.repeat(16))
    for (const file of result) {
      for (const suite of file.suites) {
        if (suite.testErrors) {
          for (const test of suite.tests) {
            if (test.error) {
              consola.log(chalk.red(`${chalk.bgRedBright.black.bold(' FAIL ')} ${suite.title} › ${chalk.bold(test.title)}`))
              consola.log(`\n${test.error.stack ?? test.error.message}\n`)
            }
          }
        }
      }
    }
  }

  console.log('―'.repeat(16))

  // Coverage
  const emptyCoverageIgnored = [
    ...config.match ?? [],
    ...config.ignored ?? [],
  ]
  const emptyCoverage = await getEmptyCoverageFromFiles(config.collectCoverageMatch, config.targetDirectory, emptyCoverageIgnored)
  let mergedCoverage = mergeCoverage(result.map(r => r.coverage).reduce((a, b) => a.concat(b), []).concat(...emptyCoverage))
  mergedCoverage = computeCoveredLines(mergedCoverage)
  const uncoveredFiles = mergedCoverage.filter(c => c.linesCovered === 0)
  if (uncoveredFiles.length > 0) {
    consola.log(chalk.red(`No coverage:\n${uncoveredFiles.map(c => `  ${c.path}`).join('\n')}`))
  }
  const partiallyCoveredFiles = mergedCoverage.filter(c => c.linesCovered > 0 && c.linesCovered < c.linesTotal)
  if (partiallyCoveredFiles.length > 0) {
    consola.log(chalk.yellow(`Partial coverage:\n${
      partiallyCoveredFiles.map(c => `  ${c.path} | ${c.linesCovered}/${c.linesTotal} lines (${
        Math.round(c.linesCovered / c.linesTotal * 10000) / 100
      }%)`).join('\n')
    }`))
  }
  const coveredFilesCount = mergedCoverage.length - uncoveredFiles.length
  const totalLines = mergedCoverage.reduce((a, c) => a + c.linesTotal, 0)
  const coveredLines = mergedCoverage.reduce((a, c) => a + c.linesCovered, 0)
  consola.log(chalk[coveredLines === totalLines ? 'green' : 'yellow'].bold(`Coverage: ${
    chalk[coveredFilesCount === mergedCoverage.length ? 'green' : 'yellow'](`${coveredFilesCount}/${mergedCoverage.length} files (${
      Math.round(coveredFilesCount / mergedCoverage.length * 10000) / 100
    }%)`)
  } | ${coveredLines}/${totalLines} lines (${
    Math.round(coveredLines / totalLines * 10000) / 100
  }%)`))

  // Summary

  consola.info(`Ran ${fileList.length} tests files (${formatDurationToString(endTime - time)}, using ${runner.pool.threads.length} parallel workers)`)
  consola.log(chalk[errorSuiteCount ? 'red' : 'green'].bold(`Suites : ${suiteCount - errorSuiteCount} / ${suiteCount}\nTests  : ${testCount - errorTestCount} / ${testCount}`))
  consola.log(chalk[errorSuiteCount ? 'red' : 'green'].bold(`Errors : ${errorTestCount}`))

  await runner.close()

  return {
    result,
    stats,
  }
}
