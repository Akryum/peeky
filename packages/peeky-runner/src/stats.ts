import type { RunTestFileResult } from './runner.js'
import type { Snapshot } from './snapshot/types.js'
import type { ReporterTestSuite } from './types.js'

export function getStats (results: RunTestFileResult[]) {
  let errorSuiteCount = 0
  let testCount = 0
  let errorTestCount = 0
  const suites: ReporterTestSuite[] = []
  const failedSnapshots: Snapshot[] = []
  const passedSnapshots: Snapshot[] = []
  const newSnapshots: Snapshot[] = []
  for (const file of results) {
    failedSnapshots.push(...file.failedSnapshots)
    passedSnapshots.push(...file.passedSnapshots)
    newSnapshots.push(...file.newSnapshots)

    const processSuite = (suite: ReporterTestSuite) => {
      suites.push(suite)
      if (suite.testErrors || suite.otherErrors.length) {
        errorSuiteCount++
      }
      testCount += suite.runTestCount
      errorTestCount += suite.testErrors

      for (const child of suite.children) {
        if (child[0] === 'suite') {
          processSuite(child[1])
        }
      }
    }
    for (const suite of file.suites) {
      processSuite(suite)
    }
  }

  return {
    suiteCount: suites.length,
    errorSuiteCount,
    testCount,
    errorTestCount,
    suites,
    snapshotCount: failedSnapshots.length + passedSnapshots.length + newSnapshots.length,
    failedSnapshots,
    passedSnapshots,
    newSnapshots,
  }
}
