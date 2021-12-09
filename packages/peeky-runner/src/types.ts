import { PeekyConfig } from '@peeky/config'

export interface RunTestFileOptions {
  entry: string
  config: PeekyConfig
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
  }[]
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
  }[]
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
  testErrors: number
  otherErrors: Error[]
}

export interface Test {
  id: string
  title: string
  handler: () => unknown
  error: Error
}

export enum EventType {
  SUITE_START = 'suite:start',
  SUITE_COMPLETED = 'suite:completed',
  TEST_START = 'test:start',
  TEST_ERROR = 'test:error',
  TEST_SUCCESS = 'test:success',
  TEST_FILE_COMPLETED = 'test-file:completed',
}
