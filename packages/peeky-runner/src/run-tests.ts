import sinon from 'sinon'
import { workerEmit } from '@akryum/workerpool'
import { Context, EventType, TestSuiteInfo } from './types'

export async function runTests (ctx: Context) {
  for (const suite of ctx.suites) {
    workerEmit(EventType.SUITE_START, {
      suite: {
        id: suite.id,
        title: suite.title,
        filePath: suite.filePath,
        tests: suite.tests.map(t => ({
          id: t.id,
          title: t.title,
        })),
      } as TestSuiteInfo,
    })
    const suiteTime = Date.now()
    for (const handler of suite.beforeAllHandlers) {
      await handler()
    }

    for (const test of suite.tests) {
      sinon.restore()

      for (const handler of suite.beforeEachHandlers) {
        await handler()
      }

      const time = Date.now()
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
          duration: Date.now() - time,
        })
      } catch (e) {
        test.error = e
        const stackIndex = e.stack.search(/\s*at.*?(@peeky\/runner|peeky-runner)/)
        workerEmit(EventType.TEST_ERROR, {
          suite: {
            id: suite.id,
          },
          test: {
            id: test.id,
          },
          duration: Date.now() - time,
          error: e,
          stack: stackIndex !== -1 ? e.stack.substr(0, stackIndex) : e.stack,
        })
        suite.errors++
      }

      for (const handler of suite.afterEachHandlers) {
        await handler()
      }
    }

    for (const handler of suite.afterAllHandlers) {
      await handler()
    }

    workerEmit(EventType.SUITE_COMPLETED, {
      suite: {
        id: suite.id,
        errors: suite.errors,
      },
      duration: Date.now() - suiteTime,
    })
  }
}
