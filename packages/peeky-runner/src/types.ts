import type { SerializablePeekyConfig } from '@peeky/config'
import type { Awaitable } from '@peeky/utils'
import { FileCoverage } from './runtime/coverage.js'

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
  duration?: number
}

export type TestFlag = 'only' | 'skip' | 'todo' | null

export interface Test {
  id: string
  title: string
  handler: () => unknown
  error: Error
  flag: TestFlag
  duration?: number
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

export interface ReporterTestSuite {
  id: string
  title: string
  filePath: string
  tests: ReporterTest[]
  runTestCount: number
  duration?: number
  testErrors?: number
  otherErrors?: Error[]
}

export interface ReporterTest {
  id: string
  title: string
  flag: TestFlag
  duration?: number
  error?: Error
}

type TestSuiteInfoPayload = { suite: ReporterTestSuite }
type TestInfoPayload = TestSuiteInfoPayload & { test: ReporterTest }
type OptionalTestInfoPayload = { suite: ReporterTestSuite | null, test: ReporterTest | null }

interface ErrorSummaryPayload {
  suites: ReporterTestSuite[]
  errorTestCount: number
  testCount: number
}

interface CoverageSummaryPayload {
  uncoveredFiles: FileCoverage[]
  partiallyCoveredFiles: FileCoverage[]
  mergedCoverage: FileCoverage[]
  coveredLines: number
  totalLines: number
  coveredFilesCount: number
}

interface SummaryPayload {
  fileCount: number
  duration: number
  suiteCount: number
  errorSuiteCount: number
  testCount: number
  errorTestCount: number
}

export interface Reporter {
  log?: (payload: OptionalTestInfoPayload & { type: 'stdout' | 'stderr', text: string }) => unknown
  suiteStart?: (payload: TestSuiteInfoPayload) => unknown
  suiteComplete?: (payload: TestSuiteInfoPayload) => unknown
  testStart?: (payload: TestInfoPayload) => unknown
  testSuccess?: (payload: TestInfoPayload) => unknown
  testFail?: (payload: TestInfoPayload) => unknown
  errorSummary?: (payload: ErrorSummaryPayload) => unknown
  coverageSummary?: (payload: CoverageSummaryPayload) => unknown
  summary?: (payload: SummaryPayload) => unknown
}
