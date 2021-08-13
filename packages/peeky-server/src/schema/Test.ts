import { withFilter } from 'apollo-server-express'
import { extendType, idArg, nonNull, objectType, stringArg } from 'nexus'
import slugify from 'slugify'
import { default as AnsiUp } from 'ansi_up'
import { Context } from '../context'
import { getRunId } from './Run'
import { Status, StatusEnum } from './Status'
import { getTestSuite, TestSuiteData } from './TestSuite'

const ansiUp = new AnsiUp()

export const Test = objectType({
  name: 'Test',
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.string('slug')
    t.nonNull.string('title')
    t.nonNull.field('status', {
      type: Status,
    })
    t.int('duration')
    t.field('error', {
      type: TestError,
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
  },
})

export const TestExtendTestSuite = extendType({
  type: 'TestSuite',
  definition (t) {
    t.nonNull.list.field('tests', {
      type: Test,
    })

    t.field('testBySlug', {
      type: Test,
      args: {
        slug: nonNull(stringArg()),
      },
      resolve: (suite, { slug }) => suite.tests.find(t => t.slug === slug),
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
}

export interface TestErrorData {
  message: string
  stack: string
  snippet: string
  line: number
  col: number
}

export interface CreateTestOptions {
  id: string
  runId: string
  testSuite: TestSuiteData
  title: string
}

export async function createTest (ctx: Context, options: CreateTestOptions) {
  const test: TestData = {
    id: options.id,
    slug: slugify(options.title),
    runId: options.runId,
    testSuite: options.testSuite,
    title: options.title,
    status: 'idle',
    duration: null,
    error: null,
  }
  ctx.pubsub.publish(TestAdded, {
    test,
  } as TestAddedPayload)
  ctx.pubsub.publish(TestUpdated, {
    test,
  } as TestUpdatedPayload)
  test.testSuite.tests.push(test)
  return test
}

export function getTest (ctx: Context, testSuiteId: string, id: string) {
  const testSuite = getTestSuite(ctx, testSuiteId)
  const test = testSuite.tests.find(t => t.id === id)
  if (!test) {
    throw new Error(`Test ${id} not found`)
  }
  return test
}

export async function updateTest (ctx: Context, testSuiteId: string, id: string, data: Partial<Omit<TestData, 'id' | 'runId' | 'testSuiteId'>>) {
  const test = getTest(ctx, testSuiteId, id)
  Object.assign(test, data)
  ctx.pubsub.publish(TestUpdated, {
    test,
  } as TestUpdatedPayload)
  return test
}
