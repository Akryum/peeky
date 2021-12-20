import { performance } from 'perf_hooks'
import { createReactiveFileSystem } from 'reactive-fs'
import { ProgramPeekyConfig } from '@peeky/config'
import { setupRunner } from './runner.js'
import { getStats } from './stats.js'
import { computeCoveredLines, getEmptyCoverageFromFiles, mergeCoverage } from './runtime/coverage.js'
import { createConsoleFancyReporter } from './reporters/console-fancy.js'
import { createRawReporter } from './reporters/raw.js'

export interface RunAllOptions {
  quickTestFilter?: string
}

export async function runAllTests (config: ProgramPeekyConfig, options: RunAllOptions = {}) {
  const reporters = config.reporters ? config.reporters.map(id => {
    if (id === 'console-fancy') {
      return createConsoleFancyReporter()
    } else if (id === 'console-json') {
      return createRawReporter(data => {
        console.log(JSON.stringify(data))
      })
    }
  }) : [
    createConsoleFancyReporter(),
  ]

  const testFiles = await createReactiveFileSystem({
    baseDir: config.targetDirectory,
    glob: config.match,
    ignored: config.ignored,
  })

  const runner = await setupRunner({
    config,
    testFiles,
    reporters,
  })

  let fileList = runner.testFiles.list()

  if (options.quickTestFilter) {
    const reg = new RegExp(options.quickTestFilter, 'i')
    fileList = fileList.filter(f => reg.test(f))
  }

  const time = performance.now()
  const result = await Promise.all(fileList.map(f => runner.runTestFile(f)))
  const endTime = performance.now()

  const stats = getStats(result)
  const {
    suites,
    suiteCount,
    errorSuiteCount,
    testCount,
    errorTestCount,
  } = stats

  // Error summary
  if (errorTestCount) {
    reporters.forEach(r => r.errorSummary?.({ suites, errorTestCount, testCount }))
  }

  // Coverage
  const emptyCoverageIgnored = [
    ...config.match ?? [],
    ...config.ignored ?? [],
  ]
  const emptyCoverage = await getEmptyCoverageFromFiles(config.collectCoverageMatch, config.targetDirectory, emptyCoverageIgnored)
  let mergedCoverage = mergeCoverage(result.map(r => r.coverage).reduce((a, b) => a.concat(b), []).concat(...emptyCoverage))
  mergedCoverage = computeCoveredLines(mergedCoverage)
  const uncoveredFiles = mergedCoverage.filter(c => c.linesCovered === 0)
  const partiallyCoveredFiles = mergedCoverage.filter(c => c.linesCovered > 0 && c.linesCovered < c.linesTotal)
  const coveredFilesCount = mergedCoverage.length - uncoveredFiles.length
  const totalLines = mergedCoverage.reduce((a, c) => a + c.linesTotal, 0)
  const coveredLines = mergedCoverage.reduce((a, c) => a + c.linesCovered, 0)
  reporters.forEach(r => r.coverageSummary?.({
    uncoveredFiles,
    partiallyCoveredFiles,
    mergedCoverage,
    coveredFilesCount,
    totalLines,
    coveredLines,
  }))

  // Summary
  const duration = endTime - time
  reporters.forEach(r => r.summary?.({
    fileCount: fileList.length,
    duration,
    suiteCount,
    errorSuiteCount,
    testCount,
    errorTestCount,
  }))

  await runner.close()

  return {
    result,
    stats,
  }
}
