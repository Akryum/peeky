import type { SerializablePeekyConfig } from '@peeky/config'
import type { Awaitable } from '@peeky/utils'

export interface RunTestFileOptions {
  entry: string
  config: SerializablePeekyConfig
  coverage: CoverageOptions
  clearDeps?: string[]
}

export interface CoverageOptions {
  root: string
  ignored: string[]
}

export interface Context {
  options: RunTestFileOptions
  suites: TestSuite[]
  pragma: Record<string, any>
}

export interface TestSuiteInfo {
  id: string
  title: string
  filePath: string
  tests: {
    id: string
    title: string
    flag: TestFlag
  }[]
  runTestCount: number
}

export interface TestSuiteResult {
  id: string
  title: string
  filePath: string
  testErrors: number
  otherErrors: Error[]
  tests: {
    id: string
    title: string
    error: Error
    flag: TestFlag
  }[]
  runTestCount: number
}

export interface TestSuite {
  id: string
  title: string
  filePath: string
  beforeAllHandlers: (() => unknown)[]
  beforeEachHandlers: (() => unknown)[]
  afterAllHandlers: (() => unknown)[]
  afterEachHandlers: (() => unknown)[]
  tests: Test[]
  ranTests: Test[]
  testErrors: number
  otherErrors: Error[]
}

export type TestFlag = 'only' | 'skip' | 'todo' | null

export interface Test {
  id: string
  title: string
  handler: () => unknown
  error: Error
  flag: TestFlag
}

export type DescribeFn = (title: string, handler: () => Awaitable<void>) => void
export type TestFn = ((title: string, handler: () => Awaitable<void>) => void) & {
  skip: (title: string, handler: () => Awaitable<void>) => void
  only: (title: string, handler: () => Awaitable<void>) => void
  todo: (title: string, handler?: () => Awaitable<void>) => void
}
export type BeforeAllFn = (handler: () => Awaitable<void>) => void
export type AfterAllFn = (handler: () => Awaitable<void>) => void
export type BeforeEachFn = (handler: () => Awaitable<void>) => void
export type AfterEachFn = (handler: () => Awaitable<void>) => void
