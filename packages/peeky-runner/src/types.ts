import type { SerializablePeekyConfig, TestEnvironmentBase } from '@peeky/config'
import type { Awaitable } from '@peeky/utils'
import { Snapshot } from './snapshot/types.js'

export interface RunTestFileOptions {
  entry: string
  config: SerializablePeekyConfig
  coverage: CoverageOptions
  clearDeps?: string[]
  updateSnapshots?: boolean
}

export interface CoverageOptions {
  root: string
  ignored: string[]
}

export interface Context {
  options: RunTestFileOptions
  suites: TestSuite[]
  pragma: Record<string, any>
  snapshots: Snapshot[]
  runtimeEnv: TestEnvironmentBase
}

export type TestFlag = 'only' | 'skip' | 'todo' | null

export interface TestSuite {
  id: string
  title: string
  allTitles: string[]
  filePath: string
  beforeAllHandlers: (() => unknown)[]
  beforeEachHandlers: (() => unknown)[]
  afterAllHandlers: (() => unknown)[]
  afterEachHandlers: (() => unknown)[]
  children: TestSuiteChild[]
  childrenToRun: TestSuiteChild[]
  parent: TestSuite | null
  flag: TestFlag
  ranTests: Test[]
  testErrors: number
  otherErrors: Error[]
  duration?: number
}

export interface Test {
  id: string
  title: string
  handler: () => unknown
  error: Error
  flag: TestFlag
  failedSnapshots: number
  snapshots: Snapshot[]
  duration?: number
  envResult?: any
}

export type TestSuiteChild = ['suite', TestSuite] | ['test', Test]

export type DescribeFn = ((title: string, handler: () => Awaitable<void>) => void) & {
  skip: (title: string, handler: () => Awaitable<void>) => void
  only: (title: string, handler: () => Awaitable<void>) => void
  todo: (title: string, handler?: () => Awaitable<void>) => void
}
export type TestFn = ((title: string, handler: () => Awaitable<void>) => void) & {
  skip: (title: string, handler: () => Awaitable<void>) => void
  only: (title: string, handler: () => Awaitable<void>) => void
  todo: (title: string, handler?: () => Awaitable<void>) => void
}
export type BeforeAllFn = (handler: () => Awaitable<void>) => void
export type AfterAllFn = (handler: () => Awaitable<void>) => void
export type BeforeEachFn = (handler: () => Awaitable<void>) => void
export type AfterEachFn = (handler: () => Awaitable<void>) => void

export type ReporterSuiteChild = ['suite', ReporterTestSuite] | ['test', ReporterTest]

export interface ReporterTestSuite {
  id: string
  title: string
  allTitles: string[]
  filePath: string
  flag: TestFlag
  children: ReporterSuiteChild[]
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

interface SnapshotSummaryPayload {
  snapshotCount: number
  failedSnapshots: Snapshot[]
}

interface SummaryPayload {
  fileCount: number
  duration: number
  suiteCount: number
  errorSuiteCount: number
  testCount: number
  errorTestCount: number
  snapshotCount: number
  failedSnapshotCount: number
  updatedSnapshotCount: number
  newSnapshotCount: number
}

export interface Reporter {
  log?: (payload: OptionalTestInfoPayload & { type: 'stdout' | 'stderr', text: string, file?: string }) => unknown
  suiteStart?: (payload: TestSuiteInfoPayload) => unknown
  suiteComplete?: (payload: TestSuiteInfoPayload) => unknown
  testFail?: (payload: TestInfoPayload) => unknown
  errorSummary?: (payload: ErrorSummaryPayload) => unknown
  snapshotSummary?: (payload: SnapshotSummaryPayload) => unknown
  summary?: (payload: SummaryPayload) => unknown
}
