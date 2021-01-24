import sinon from 'sinon'
import must from 'must'
import { Context } from './types'
import { createPeekyGlobal } from './peeky-global'
import { Register } from './test-register'

export function registerGlobals (ctx: Context, target: any, register: Register) {
  // Global objects
  target.peeky = createPeekyGlobal(ctx)
  target.expect = must
  target.sinon = sinon

  // Register
  target.describe = register.exposed.describe
  target.it = target.test = register.exposed.test
  target.beforeAll = register.exposed.beforeAll
  target.afterAll = register.exposed.afterAll
  target.beforeEach = register.exposed.beforeEach
  target.afterEach = register.exposed.afterEach
}
