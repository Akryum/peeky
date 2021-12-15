import { basename, extname } from 'path'
import shortid from 'shortid'
import slugify from 'slugify'
import type {
  AfterAllFn,
  AfterEachFn,
  BeforeAllFn,
  BeforeEachFn,
  Context,
  DescribeFn,
  TestFn,
  TestSuite,
} from '../types'

export function setupRegister (ctx: Context): {
  exposed: {
    describe: DescribeFn
    test: TestFn
    beforeAll: BeforeAllFn
    afterAll: AfterAllFn
    beforeEach: BeforeEachFn
    afterEach: AfterEachFn
  }
  run: () => Promise<void>
} {
  const suiteHandlers: (() => Promise<unknown>)[] = []
  let currentSuite: TestSuite
  let anonymouseSuite: TestSuite

  const createSuite = (title: string) => {
    const suite = {
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
    ctx.suites.push(suite)
    return suite
  }

  const ensureAnonymousSuite = () => {
    if (!anonymouseSuite) {
      const title = slugify(basename(ctx.options.entry, extname(ctx.options.entry)))
        .replace(/\.(test|spec)/g, '')
        .replace(/\./g, '-')
      anonymouseSuite = createSuite(title)
    }
    return anonymouseSuite
  }

  function describe (title: string, handler: () => unknown) {
    suiteHandlers.push(async () => {
      if (currentSuite) {
        throw new Error('Nested describe() calls are not supported yet')
      }
      currentSuite = createSuite(title)
      await handler()
      currentSuite = null
    })
  }

  function test (title: string, handler: () => unknown) {
    let target = currentSuite
    if (!currentSuite) {
      target = ensureAnonymousSuite()
    }
    target.tests.push({
      id: shortid(),
      title,
      handler,
      error: null,
      flag: null,
    })
  }

  function beforeAll (handler: () => unknown) {
    let target = currentSuite
    if (!currentSuite) {
      target = ensureAnonymousSuite()
    }
    target.beforeAllHandlers.push(handler)
  }

  function afterAll (handler: () => unknown) {
    let target = currentSuite
    if (!currentSuite) {
      target = ensureAnonymousSuite()
    }
    target.afterAllHandlers.push(handler)
  }

  function beforeEach (handler: () => unknown) {
    let target = currentSuite
    if (!currentSuite) {
      target = ensureAnonymousSuite()
    }
    target.beforeEachHandlers.push(handler)
  }

  function afterEach (handler: () => unknown) {
    let target = currentSuite
    if (!currentSuite) {
      target = ensureAnonymousSuite()
    }
    target.afterEachHandlers.push(handler)
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
