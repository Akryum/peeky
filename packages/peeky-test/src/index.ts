import {
  AfterAllFn,
  AfterEachFn,
  BeforeAllFn,
  BeforeEachFn,
  DescribeFn,
  PeekyGlobals,
  TestFn,
} from '@peeky/runner'

export * from '@peeky/config'
export * from '@peeky/runner'

// Register hooks
export declare const describe: DescribeFn
export declare const test: TestFn
export declare const it: TestFn
export declare const beforeAll: BeforeAllFn
export declare const afterAll: AfterAllFn
export declare const beforeEach: BeforeEachFn
export declare const afterEach: AfterEachFn
export declare const retry: PeekyGlobals['retry']
export declare const mockModule: PeekyGlobals['mockModule']

declare global {
  const describe: DescribeFn
  const it: TestFn
  const test: TestFn
  const beforeAll: BeforeAllFn
  const afterAll: AfterAllFn
  const beforeEach: BeforeEachFn
  const afterEach: AfterEachFn
  const expect: typeof import('expect').expect
  const sinon: typeof import('sinon')
  const peeky: PeekyGlobals
}
