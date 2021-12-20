import { RunTestFileResult } from './runner.js'
import { ReporterTestSuite } from './types.js'

export function getStats (results: RunTestFileResult[]) {
  let errorSuiteCount = 0
  let testCount = 0
  let errorTestCount = 0
  const suites: ReporterTestSuite[] = []
  for (const file of results) {
    suites.push(...file.suites)
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
  }
}
