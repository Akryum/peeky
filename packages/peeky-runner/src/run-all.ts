import { performance } from 'perf_hooks'
import { ProgramPeekyConfig } from '@peeky/config'
import glob from 'fast-glob'
import { setupRunner } from './runner.js'
import { getStats } from './stats.js'
import { createConsoleFancyReporter } from './reporters/console-fancy.js'
import { createRawReporter } from './reporters/raw.js'
import { reportCoverage } from './coverage.js'

export interface RunAllOptions {
  quickTestFilter?: string
  updateSnapshots?: boolean
}

export async function runAllTests (config: ProgramPeekyConfig, options: RunAllOptions = {}) {
  const reporters = config.reporters
    ? config.reporters.map(id => {
      if (id === 'console-fancy') {
        return createConsoleFancyReporter()
      } else if (id === 'console-json') {
        return createRawReporter(data => {
          console.log(JSON.stringify(data))
        })
      }
      return null
    }).filter(Boolean)
    : [
      createConsoleFancyReporter(),
    ]

  let fileList = await glob(config.match, {
    cwd: config.targetDirectory,
    ignore: Array.isArray(config.ignored) ? config.ignored : [config.ignored],
  })

  const runner = await setupRunner({
    config,
    reporters,
  })

  if (options.quickTestFilter) {
    const reg = new RegExp(options.quickTestFilter, 'i')
    fileList = fileList.filter(f => reg.test(f))
  }

  const time = performance.now()
  const result = await Promise.all(fileList.map(f => runner.runTestFile(f, [], options.updateSnapshots)))
  const endTime = performance.now()

  const stats = getStats(result)
  const {
    suites,
    suiteCount,
    errorSuiteCount,
    testCount,
    errorTestCount,
    snapshotCount,
    failedSnapshots,
    newSnapshots,
  } = stats

  // Error summary
  if (errorTestCount) {
    reporters.forEach(r => r.errorSummary?.({ suites, errorTestCount, testCount }))
  }
  if (failedSnapshots.length) {
    reporters.forEach(r => r.snapshotSummary?.({ snapshotCount, failedSnapshots }))
  }

  // Coverage
  if (config.collectCoverage) {
    await reportCoverage(config.coverageOptions)
  }

  // Summary
  const duration = endTime - time
  reporters.forEach(r => r.summary?.({
    fileCount: fileList.length,
    duration,
    suiteCount,
    errorSuiteCount,
    testCount,
    errorTestCount,
    snapshotCount,
    failedSnapshotCount: options.updateSnapshots ? 0 : failedSnapshots.length,
    updatedSnapshotCount: options.updateSnapshots ? failedSnapshots.length : 0,
    newSnapshotCount: newSnapshots.length,
  }))

  await runner.close()

  return {
    result,
    stats,
  }
}
