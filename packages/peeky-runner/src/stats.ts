import { RunTestFileResult } from './runner.js'
import { Snapshot } from './snapshot/types.js'
import { ReporterTestSuite } from './types.js'

export function getStats (results: RunTestFileResult[]) {
  let errorSuiteCount = 0
  let testCount = 0
  let errorTestCount = 0
  const suites: ReporterTestSuite[] = []
  const failedSnapshots: Snapshot[] = []
  const passedSnapshots: Snapshot[] = []
  const newSnapshots: Snapshot[] = []
  for (const file of results) {
    suites.push(...file.suites)
    failedSnapshots.push(...file.failedSnapshots)
    passedSnapshots.push(...file.passedSnapshots)
    newSnapshots.push(...file.newSnapshots)
    for (const suite of file.suites) {
      if (suite.testErrors || suite.otherErrors.length) {
        errorSuiteCount++
      }
      testCount += suite.runTestCount
      errorTestCount += suite.testErrors
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
