import { basename } from 'pathe'
import { performance } from 'perf_hooks'
import type { Context, Test } from '../types'
import { setCurrentSuite, setCurrentTest } from './global-context.js'
import { toMainThread } from './message.js'

export async function runTests (ctx: Context, failOnSnapshots: boolean) {
  const { default: sinon } = await import('sinon')

  for (const suite of ctx.suites) {
    setCurrentSuite(suite)

    let testsToRun: Test[]
    const onlyTests = suite.tests.filter(t => t.flag === 'only')
    if (onlyTests.length) {
      testsToRun = onlyTests
    } else {
      testsToRun = suite.tests.filter(t => t.flag !== 'skip' && t.flag !== 'todo')
    }

    toMainThread().onSuiteStart({
      id: suite.id,
      title: suite.title,
      filePath: suite.filePath,
      tests: suite.tests.map(t => ({
        id: t.id,
        title: t.title,
        flag: t.flag,
      })),
      runTestCount: testsToRun.length,
    })

    const suiteTime = performance.now()

    if (testsToRun.length) {
      for (const handler of suite.beforeAllHandlers) {
        await handler()
      }

      for (const test of testsToRun) {
        setCurrentTest(test)
        sinon.restore()

        for (const handler of suite.beforeEachHandlers) {
          await handler()
        }

        toMainThread().onTestStart(suite.id, test.id)
        const time = performance.now()
        try {
          await test.handler()

          if (failOnSnapshots && test.failedSnapshots > 0) {
            const e = new Error(`Mismatched ${test.failedSnapshots} snapshot${test.failedSnapshots > 1 ? 's' : ''}`)
            const stack = test.snapshots.find(s => s.error).error.stack.split('\n')
            stack[0] = e.message
            e.stack = stack.join('\n')
            throw e
          }

          test.duration = performance.now() - time
          toMainThread().onTestSuccess(suite.id, test.id, test.duration)
        } catch (e) {
          test.duration = performance.now() - time
          test.error = e
          let stackIndex = e.stack ? e.stack.lastIndexOf(basename(ctx.options.entry)) : -1
          if (stackIndex !== -1) {
            // Continue to the end of the line
            stackIndex = e.stack.indexOf('\n', stackIndex)
          }
          toMainThread().onTestError(suite.id, test.id, test.duration, {
            message: e.message,
            stack: stackIndex !== -1 ? e.stack.substring(0, stackIndex) : e.stack,
            data: JSON.stringify(e),
            matcherResult: JSON.stringify(e.matcherResult),
          })
          suite.testErrors++
        }

        for (const handler of suite.afterEachHandlers) {
          await handler()
        }

        if (test.snapshots.length) {
          toMainThread().onTestSnapshotsProcessed(suite.id, test.id, test.snapshots)
        }

        setCurrentTest(null)
      }

      for (const handler of suite.afterAllHandlers) {
        await handler()
      }
    }

    suite.ranTests = testsToRun
    suite.duration = performance.now() - suiteTime

    if (ctx.options.config.emptySuiteError && !testsToRun.length) {
      suite.otherErrors.push(new Error(`Empty test suite: ${suite.title}`))
    }

    toMainThread().onSuiteComplete({
      id: suite.id,
      testErrors: suite.testErrors,
      otherErrors: suite.otherErrors,
    }, suite.duration)

    setCurrentSuite(null)
  }
}
