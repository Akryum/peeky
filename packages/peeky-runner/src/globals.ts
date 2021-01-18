import sinon from 'sinon'
import must from 'must'
import shortid from 'shortid'
import { Context, TestSuite } from './types'

export function registerGlobals (ctx: Context, target: any) {
  target.expect = must
  target.sinon = sinon

  let currentSuite: TestSuite

  target.describe = (title: string, handler: () => unknown) => {
    currentSuite = {
      id: shortid(),
      title,
      filePath: ctx.options.entry,
      tests: [],
      beforeAllHandlers: [],
      beforeEachHandlers: [],
      afterAllHandlers: [],
      afterEachHandlers: [],
      errors: 0,
    }
    ctx.suites.push(currentSuite)
    handler()
  }

  target.it = target.test = (title: string, handler: () => unknown) => {
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

  target.beforeAll = (handler: () => unknown) => {
    if (!currentSuite) {
      throw new Error('beforeAll() must be used inside the describe() handler')
    }
    currentSuite.beforeAllHandlers.push(handler)
  }

  target.afterAll = (handler: () => unknown) => {
    if (!currentSuite) {
      throw new Error('afterAll() must be used inside the describe() handler')
    }
    currentSuite.afterAllHandlers.push(handler)
  }

  target.beforeEach = (handler: () => unknown) => {
    if (!currentSuite) {
      throw new Error('beforeEach() must be used inside the describe() handler')
    }
    currentSuite.beforeEachHandlers.push(handler)
  }

  target.afterEach = (handler: () => unknown) => {
    if (!currentSuite) {
      throw new Error('afterEach() must be used inside the describe() handler')
    }
    currentSuite.afterEachHandlers.push(handler)
  }
}
