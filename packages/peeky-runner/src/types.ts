
export interface RunTestFileOptions {
  entry: string
}

export interface Context {
  options: RunTestFileOptions
  suites: TestSuite[]
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
  errors: number
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
  errors: number
}

export interface Test {
  id: string
  title: string
  handler: () => unknown
  error: Error
}
