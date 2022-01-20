import { fileURLToPath } from 'url'
import { withFilter } from 'apollo-server-express'
import { enumType, extendType, idArg, nonNull, objectType, stringArg } from 'nexus'
import slugify from 'slugify'
import AnsiUpPackage from 'ansi_up'
import { TestFlag } from '@peeky/runner'
import type { Context } from '../context'
import { getRunId } from './Run.js'
import { Status, StatusEnum } from './Status.js'
import { getTestSuite, TestSuiteData } from './TestSuite.js'
import { SnapshotData } from './Snapshot.js'
import { getSrcFile } from '../util.js'

const __filename = fileURLToPath(import.meta.url)

// @ts-expect-error ansi_up doesn't support Node esm correctly
const AnsiUp = AnsiUpPackage.default as typeof AnsiUpPackage

const ansiUp = new AnsiUp()

ansiUp.use_classes = true

export const Test = objectType({
  name: 'Test',
  sourceType: {
    module: getSrcFile(__filename),
    export: 'TestData',
  },
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.string('slug')
    t.nonNull.string('title')
    t.nonNull.field('status', {
      type: Status,
    })
    t.float('duration')
    t.field('error', {
      type: TestError,
    })
    t.field('flag', {
      type: enumType({
        name: 'TestFlag',
        members: [
          'skip',
          'only',
          'todo',
        ],
      }),
    })
    t.nonNull.list.field('logs', {
      type: nonNull(TestLog),
    })
    t.nonNull.boolean('hasLogs', {
      resolve: test => !!test.logs.length,
    })
    t.nonNull.field('suite', {
      type: 'TestSuite',
      resolve: test => test.testSuite,
    })
  },
})

export const TestError = objectType({
  name: 'TestError',
  definition (t) {
    t.nonNull.string('message', {
      resolve: (error: any) => ansiUp.ansi_to_html(error.message),
    })
    t.string('stack', {
      resolve: (error: any) => ansiUp.ansi_to_html(error.stack).replace(/\n/g, '<br>'),
    })
    t.string('snippet')
    t.int('line')
    t.int('col')
    t.string('actual')
    t.string('expected')
  },
})

export const TestLog = objectType({
  name: 'TestLog',
  definition (t) {
    t.nonNull.field('type', {
      type: enumType({
        name: 'TestLogType',
        members: [
          'stdout',
          'stderr',
        ],
      }),
    })
    t.nonNull.string('text')
  },
})

export const TestExtendTestSuite = extendType({
  type: 'TestSuite',
  definition (t) {
    t.field('testById', {
      type: Test,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (suite, { id }) => suite.children.find(t => t.id === id) as TestData,
    })

    t.field('testBySlug', {
      type: Test,
      args: {
        slug: nonNull(stringArg()),
      },
      resolve: (suite, { slug }) => suite.children.find(t => t.slug === slug) as TestData,
    })
  },
})

export const TestAdded = 'test-added'

export interface TestAddedPayload {
  test: TestData
}

export const TestUpdated = 'test-updated'

export interface TestUpdatedPayload {
  test: TestData
}

export const TestSupbscriptions = extendType({
  type: 'Subscription',
  definition (t) {
    t.nonNull.field('testAdded', {
      type: Test,
      args: {
        runId: nonNull(idArg()),
        runTestFileId: idArg(),
      },
      subscribe: withFilter(
        (_, args, ctx) => ctx.pubsub.asyncIterator(TestAdded),
        (payload: TestAddedPayload, args) => payload.test.runId === getRunId(args.runId) &&
          (!args.runTestFileId || payload.test.testSuite.runTestFile.id === args.runTestFileId),
      ),
      resolve: (payload: TestAddedPayload) => payload.test,
    })

    t.nonNull.field('testUpdatedInRun', {
      type: Test,
      args: {
        runId: nonNull(idArg()),
        runTestFileId: idArg(),
      },
      subscribe: withFilter(
        (_, args, ctx) => ctx.pubsub.asyncIterator(TestUpdated),
        (payload: TestAddedPayload, args) => payload.test.runId === getRunId(args.runId) &&
          (!args.runTestFileId || payload.test.testSuite.runTestFile.id === args.runTestFileId),
      ),
      resolve: (payload: TestUpdatedPayload) => payload.test,
    })

    t.nonNull.field('testUpdatedBySlug', {
      type: Test,
      args: {
        runId: nonNull(idArg()),
        testSlug: nonNull(stringArg()),
      },
      subscribe: withFilter(
        (_, args, ctx) => ctx.pubsub.asyncIterator(TestUpdated),
        (payload: TestAddedPayload, args) => payload.test.runId === getRunId(args.runId) &&
          payload.test.slug === args.testSlug,
      ),
      resolve: (payload: TestUpdatedPayload) => payload.test,
    })
  },
})

export interface TestData {
  id: string
  slug: string
  runId: string
  testSuite: TestSuiteData
  title: string
  status: StatusEnum
  duration: number
  error: TestErrorData
  flag: TestFlag
  logs: TestLogData[]
  snapshots: SnapshotData[]
  failedSnapshotCount: number
}

export interface TestLogData {
  type: 'stdout' | 'stderr'
  text: string
}

export interface TestErrorData {
  message: string
  stack: string
  snippet: string
  line: number
  col: number
  expected: any
  actual: any
}

export interface CreateTestOptions {
  id: string
  runId: string
  testSuite: TestSuiteData
  title: string
  flag: TestFlag
  status: StatusEnum
}

export async function createTest (ctx: Context, options: CreateTestOptions) {
  const test: TestData = {
    id: options.id,
    slug: slugify(options.title),
    runId: options.runId,
    testSuite: options.testSuite,
    title: options.title,
    status: options.status,
    flag: options.flag,
    duration: null,
    error: null,
    logs: [],
    snapshots: [],
    failedSnapshotCount: 0,
  }
  ctx.pubsub.publish(TestAdded, {
    test,
  } as TestAddedPayload)
  ctx.pubsub.publish(TestUpdated, {
    test,
  } as TestUpdatedPayload)
  return test
}

export function getTest (ctx: Context, testSuiteId: string, id: string): TestData {
  const testSuite = getTestSuite(ctx, testSuiteId)
  const test = testSuite.children.find(t => t.id === id) as TestData
  if (!test) {
    throw new Error(`Test ${id} not found`)
  }
  return test
}

type UpdateTestPayload = Partial<Omit<TestData, 'id' | 'runId' | 'testSuiteId'>>

export async function updateTest (ctx: Context, testSuiteId: string, id: string, data: UpdateTestPayload | ((currentData: TestData) => UpdateTestPayload)) {
  const test = getTest(ctx, testSuiteId, id)
  if (!test) return
  const newData = typeof data === 'function' ? data(test) : data
  Object.assign(test, newData)
  ctx.pubsub.publish(TestUpdated, {
    test,
  } as TestUpdatedPayload)
  return test
}
