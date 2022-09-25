import { basename } from 'pathe'
import { performance } from 'perf_hooks'
import sinon from 'sinon'
import type { Context, TestSuite, Test } from '../types'
import { setCurrentSuite, setCurrentTest } from './global-context.js'
import { toMainThread } from './message.js'

export async function runTests (ctx: Context, failOnSnapshots: boolean) {
  for (const suite of ctx.suites) {
    await runSuite(ctx, suite, failOnSnapshots)
  }
}

async function runSuite (ctx: Context, suite: TestSuite, failOnSnapshots: boolean) {
  setCurrentSuite(suite)

  toMainThread().onSuiteStart({
    id: suite.id,
  })

  const completedTests: Record<string, number> = {}

  const suiteTime = performance.now()

  if (suite.childrenToRun.length) {
    for (const handler of suite.beforeAllHandlers) {
      await handler()
    }

    const allParents = getSuitesFromRootToLeaf(suite)

    for (const child of suite.childrenToRun) {
      if (child[0] === 'suite') {
        const childSuite = child[1]
        await runSuite(ctx, childSuite, failOnSnapshots)
        setCurrentSuite(suite)
      } else if (child[0] === 'test') {
        const test = child[1]
        setCurrentTest(test)
        sinon.restore()

        for (const parentSuite of allParents) {
          for (const handler of parentSuite.beforeEachHandlers) {
            await handler()
          }
        }

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
          completedTests[test.id] = test.duration
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
        } finally {
          test.envResult = await ctx.runtimeEnv.getResult()
          if (test.envResult != null) {
            toMainThread().onTestEnvResult(suite.id, test.id, test.envResult)
          }
        }

        for (const parentSuite of allParents) {
          for (const handler of parentSuite.afterEachHandlers) {
            await handler()
          }
        }

        if (test.snapshots.length) {
          toMainThread().onTestSnapshotsProcessed(suite.id, test.id, test.snapshots)
        }

        setCurrentTest(null)
      }
    }

    for (const handler of suite.afterAllHandlers) {
      await handler()
    }
  }

  const ranTestChildren = suite.childrenToRun.filter(child => child[0] === 'test') as ['test', Test][]
  suite.ranTests = ranTestChildren.map(child => child[1])
  suite.duration = performance.now() - suiteTime

  if (ctx.options.config.emptySuiteError && !suite.childrenToRun.length) {
    suite.otherErrors.push(new Error(`Empty test suite: ${suite.title}`))
  }

  toMainThread().onSuiteComplete({
    id: suite.id,
    testErrors: suite.testErrors,
    otherErrors: suite.otherErrors,
  }, suite.duration, completedTests)

  setCurrentSuite(null)
}

function getSuitesFromRootToLeaf (suite: TestSuite): TestSuite[] {
  const suites = suite.parent ? getSuitesFromRootToLeaf(suite.parent) : []
  suites.push(suite)
  return suites
}
