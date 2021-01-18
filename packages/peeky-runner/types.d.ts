/* eslint-disable @typescript-eslint/no-namespace */

import must from 'must'

declare global {
  const describe: (title: string, handler: () => unknown) => void
  const it: (title: string, handler: () => unknown) => void
  const test: (title: string, handler: () => unknown) => void
  const beforeAll: (handler: () => unknown) => void
  const afterAll: (handler: () => unknown) => void
  const beforeEach: (handler: () => unknown) => void
  const afterEach: (handler: () => unknown) => void
  const expect: typeof must
  const sinon: typeof sinon
}

export { default as sinon } from 'sinon'
export * from './dist/index'
