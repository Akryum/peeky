import { withFilter } from 'apollo-server-express'
import { extendType, idArg, nonNull, objectType } from 'nexus'
import { Context } from '../context'
import { Status, StatusEnum } from './Status'
import { getTestSuite, TestSuiteAdded, TestSuiteData } from './TestSuite'

export const Test = objectType({
  name: 'Test',
  definition (t) {
    t.nonNull.id('id')
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
    t.nonNull.string('message')
    t.string('stack')
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
        (payload: TestAddedPayload, args) => payload.test.runId === args.runId &&
          (!args.runTestFileId || payload.test.testSuite.runTestFile.id === args.runTestFileId),
      ),
      resolve: (payload: TestAddedPayload) => payload.test,
    })

    t.nonNull.field('testUpdated', {
      type: Test,
      args: {
        runId: nonNull(idArg()),
        runTestFileId: idArg(),
      },
      subscribe: withFilter(
        (_, args, ctx) => ctx.pubsub.asyncIterator(TestUpdated),
        (payload: TestAddedPayload, args) => payload.test.runId === args.runId &&
          (!args.runTestFileId || payload.test.testSuite.runTestFile.id === args.runTestFileId),
      ),
      resolve: (payload: TestUpdatedPayload) => payload.test,
    })
  },
})

export interface TestData {
  id: string
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
