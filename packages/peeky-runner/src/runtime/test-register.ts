import shortid from 'shortid'
import { Context, TestSuite } from '../types'

export function setupRegister (ctx: Context) {
  const suiteHandlers: (() => Promise<unknown>)[] = []
  let currentSuite: TestSuite

  function describe (title: string, handler: () => unknown) {
    suiteHandlers.push(async () => {
      if (currentSuite) {
        throw new Error('Nested describe() calls are not supported yet')
      }
      currentSuite = {
        id: shortid(),
        title,
        filePath: ctx.options.entry,
        tests: [],
        beforeAllHandlers: [],
        beforeEachHandlers: [],
        afterAllHandlers: [],
        afterEachHandlers: [],
        testErrors: 0,
        otherErrors: [],
      }
      ctx.suites.push(currentSuite)
      await handler()
      currentSuite = null
    })
  }

  function test (title: string, handler: () => unknown) {
    if (!currentSuite) {
      throw new Error('test() must be used inside the describe() handler')
    }
    currentSuite.tests.push({
      id: shortid(),
      title,
      handler,
      error: null,
    })
  }

  function beforeAll (handler: () => unknown) {
    if (!currentSuite) {
      throw new Error('beforeAll() must be used inside the describe() handler')
    }
    currentSuite.beforeAllHandlers.push(handler)
  }

  function afterAll (handler: () => unknown) {
    if (!currentSuite) {
      throw new Error('afterAll() must be used inside the describe() handler')
    }
    currentSuite.afterAllHandlers.push(handler)
  }

  function beforeEach (handler: () => unknown) {
    if (!currentSuite) {
      throw new Error('beforeEach() must be used inside the describe() handler')
    }
    currentSuite.beforeEachHandlers.push(handler)
  }

  function afterEach (handler: () => unknown) {
    if (!currentSuite) {
      throw new Error('afterEach() must be used inside the describe() handler')
    }
    currentSuite.afterEachHandlers.push(handler)
  }

  /**
   * Run the suite handlers to register suites and tests.
   * Shouldn't be exposed to the test files.
   */
  async function run () {
    for (const handler of suiteHandlers) {
      await handler()
    }
  }

  return {
    exposed: {
      describe,
      test,
      beforeAll,
      afterAll,
      beforeEach,
      afterEach,
    },
    run,
  }
}

export type Register = ReturnType<typeof setupRegister>
