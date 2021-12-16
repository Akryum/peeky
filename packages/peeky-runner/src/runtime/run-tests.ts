import { basename } from 'path'
import { performance } from 'perf_hooks'
import { workerEmit } from '@akryum/workerpool'
import type { Context, TestSuiteInfo } from '../types'
import { EventType } from '../types.js'
import { Test } from '..'

export async function runTests (ctx: Context) {
  const { default: sinon } = await import('sinon')

  for (const suite of ctx.suites) {
    let testsToRun: Test[]
    const onlyTests = suite.tests.filter(t => t.flag === 'only')
    if (onlyTests.length) {
      testsToRun = onlyTests
    } else {
      testsToRun = suite.tests.filter(t => t.flag !== 'skip' && t.flag !== 'todo')
    }

    workerEmit(EventType.SUITE_START, {
      suite: {
        id: suite.id,
        title: suite.title,
        filePath: suite.filePath,
        tests: suite.tests.map(t => ({
          id: t.id,
          title: t.title,
          flag: t.flag,
        })),
        runTestCount: testsToRun.length,
      } as TestSuiteInfo,
    })

    const suiteTime = performance.now()

    if (testsToRun.length) {
      for (const handler of suite.beforeAllHandlers) {
        await handler()
      }

      for (const test of testsToRun) {
        sinon.restore()

        for (const handler of suite.beforeEachHandlers) {
          await handler()
        }

        const time = performance.now()
        workerEmit(EventType.TEST_START, {
          suite: {
            id: suite.id,
          },
          test: {
            id: test.id,
          },
        })
        try {
          await test.handler()
          workerEmit(EventType.TEST_SUCCESS, {
            suite: {
              id: suite.id,
            },
            test: {
              id: test.id,
            },
            duration: performance.now() - time,
          })
        } catch (e) {
          test.error = e
          let stackIndex = e.stack ? e.stack.lastIndexOf(basename(ctx.options.entry)) : -1
          if (stackIndex !== -1) {
            // Continue to the end of the line
            stackIndex = e.stack.indexOf('\n', stackIndex)
          }
          workerEmit(EventType.TEST_ERROR, {
            suite: {
              id: suite.id,
            },
            test: {
              id: test.id,
            },
            duration: performance.now() - time,
            error: { message: e.message, data: JSON.stringify(e) },
            stack: stackIndex !== -1 ? e.stack.substr(0, stackIndex) : e.stack,
            matcherResult: JSON.stringify(e.matcherResult),
          })
          suite.testErrors++
        }

        for (const handler of suite.afterEachHandlers) {
          await handler()
        }
      }

      for (const handler of suite.afterAllHandlers) {
        await handler()
      }
    }

    suite.ranTests = testsToRun

    if (ctx.options.config.emptySuiteError && !testsToRun.length) {
      suite.otherErrors.push(new Error(`Empty test suite: ${suite.title}`))
    }

    workerEmit(EventType.SUITE_COMPLETED, {
      suite: {
        id: suite.id,
        testErrors: suite.testErrors,
        otherErrors: suite.otherErrors,
      },
      duration: performance.now() - suiteTime,
    })
  }
}
