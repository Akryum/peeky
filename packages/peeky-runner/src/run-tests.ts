import sinon from 'sinon'
import { workerEmit } from '@akryum/workerpool'
import { Context, TestSuiteInfo } from './types'

export async function runTests (ctx: Context) {
  for (const suite of ctx.suites) {
    workerEmit('suite:start', {
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
      workerEmit('test:start', {
        suite: {
          id: suite.id,
        },
        test: {
          id: test.id,
        },
      })
      try {
        await test.handler()
        workerEmit('test:success', {
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
        workerEmit('test:error', {
          suite: {
            id: suite.id,
          },
          test: {
            id: test.id,
          },
          duration: Date.now() - time,
          error: e,
          stack: e.stack.substr(0, e.stack.indexOf('at runTests')),
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

    workerEmit('suite:completed', {
      suite: {
        id: suite.id,
        errors: suite.errors,
      },
      duration: Date.now() - suiteTime,
    })
  }
}
