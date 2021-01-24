import { RunTestFileResult } from './runner'

export function getStats (results: RunTestFileResult[]) {
  let suiteCount = 0
  let errorSuiteCount = 0
  let testCount = 0
  let errorTestCount = 0
  for (const file of results) {
    suiteCount += file.suites.length
    for (const suite of file.suites) {
      if (suite.testErrors || suite.otherErrors.length) {
        errorSuiteCount++
      }
      testCount += suite.tests.length
      errorTestCount += suite.testErrors
    }
  }

  return {
    suiteCount,
    errorSuiteCount,
    testCount,
    errorTestCount,
  }
}
