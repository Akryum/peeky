/* eslint-disable @typescript-eslint/no-namespace */

import { PeekyGlobal, must as _must, sinon as _sinon } from './dist/index'

declare global {
  const describe: (title: string, handler: () => unknown) => void
  const it: (title: string, handler: () => unknown) => void
  const test: (title: string, handler: () => unknown) => void
  const beforeAll: (handler: () => unknown) => void
  const afterAll: (handler: () => unknown) => void
  const beforeEach: (handler: () => unknown) => void
  const afterEach: (handler: () => unknown) => void
  const expect: typeof _must
  const sinon: typeof _sinon
  const peeky: PeekyGlobal
}

export * from './dist/index'
