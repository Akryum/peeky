import type { Context } from '../types'
import type { TestCollector } from './collect-tests.js'

export async function getGlobals (ctx: Context, collector: TestCollector) {
  const { default: sinon } = await import('sinon')
  const { expect } = await import('expect')

  const target = {} as any
  // Global objects
  target.expect = expect
  target.sinon = sinon

  // Register
  target.describe = collector.exposed.describe
  target.it = target.test = collector.exposed.test
  target.beforeAll = collector.exposed.beforeAll
  target.afterAll = collector.exposed.afterAll
  target.beforeEach = collector.exposed.beforeEach
  target.afterEach = collector.exposed.afterEach

  return target
}
