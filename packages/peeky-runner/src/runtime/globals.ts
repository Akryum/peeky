import type { Context } from '../types'
import type { Register } from './test-register.js'

export async function getGlobals (ctx: Context, register: Register) {
  const { default: sinon } = await import('sinon')
  const { default: expect } = await import('expect')

  const target = {} as any
  // Global objects
  target.expect = expect
  target.sinon = sinon

  // Register
  target.describe = register.exposed.describe
  target.it = target.test = register.exposed.test
  target.beforeAll = register.exposed.beforeAll
  target.afterAll = register.exposed.afterAll
  target.beforeEach = register.exposed.beforeEach
  target.afterEach = register.exposed.afterEach

  return target
}
