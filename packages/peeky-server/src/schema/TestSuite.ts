import { fileURLToPath } from 'url'
import { withFilter } from 'apollo-server-express'
import { extendType, idArg, nonNull, objectType, stringArg } from 'nexus'
import slugify from 'slugify'
import type { Context } from '../context'
import { getSrcFile } from '../util.js'
import { getRunId } from './Run.js'
import { RunTestFile, RunTestFileData } from './RunTestFile.js'
import { Status, StatusEnum } from './Status.js'
import { createTest, TestData } from './Test.js'
import { RunData } from './Run'

const __filename = fileURLToPath(import.meta.url)

export const TestSuite = objectType({
  name: 'TestSuite',
  sourceType: {
    module: getSrcFile(__filename),
    export: 'TestSuiteData',
  },
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.string('slug')
    t.nonNull.string('title')
    t.nonNull.field('status', {
      type: Status,
    })
    t.float('duration')
    t.nonNull.field('runTestFile', {
      type: RunTestFile,
      resolve: (parent) => parent.runTestFile,
    })
  },
})

export const TestSuiteExtendRun = extendType({
  type: 'Run',
  definition (t) {
    t.nonNull.list.field('testSuites', {
      type: nonNull(TestSuite),
      resolve: (parent) => testSuites.filter(s => s.runId === parent.id),
    })

    t.field('testSuiteBySlug', {
      type: TestSuite,
      args: {
        slug: nonNull(stringArg()),
      },
      resolve: (run, { slug }) => testSuites.find(s => s.runId === run.id && s.slug === slug) ??
        findSuiteInPreviousErrorFiles(run, slug),
    })
  },
})

export const TestSuiteAdded = 'test-suite-added'

export interface TestSuiteAddedPayload {
  testSuite: TestSuiteData
}

export const TestSuiteUpdated = 'test-suite-updated'

export interface TestSuiteUpdatedPayload {
  testSuite: TestSuiteData
}

export const TestSuiteSubscriptions = extendType({
  type: 'Subscription',
  definition (t) {
    t.nonNull.field('testSuiteAdded', {
      type: TestSuite,
      args: {
        runId: nonNull(idArg()),
        runTestFileId: idArg(),
      },
      subscribe: withFilter(
        (_, args, ctx) => ctx.pubsub.asyncIterator(TestSuiteAdded),
        (payload: TestSuiteAddedPayload, args) => payload.testSuite.runId === getRunId(args.runId) && (args.runTestFileId == null || payload.testSuite.runTestFile.id === args.runTestFileId),
      ),
      resolve: (payload: TestSuiteAddedPayload) => payload.testSuite,
    })

    t.nonNull.field('testSuiteUpdated', {
      type: TestSuite,
      args: {
        runId: nonNull(idArg()),
        runTestFileId: idArg(),
      },
      subscribe: withFilter(
        (_, args, ctx) => ctx.pubsub.asyncIterator(TestSuiteUpdated),
        (payload: TestSuiteUpdatedPayload, args) => payload.testSuite.runId === getRunId(args.runId) && (args.runTestFileId == null || payload.testSuite.runTestFile.id === args.runTestFileId),
      ),
      resolve: (payload: TestSuiteUpdatedPayload) => payload.testSuite,
    })
  },
})

export interface TestSuiteData {
  id: string
  slug: string
  runId: string
  runTestFile: RunTestFileData
  title: string
  status: StatusEnum
  duration: number
  tests: TestData[]
}

export let testSuites: TestSuiteData[] = []

export interface CreateTestSuiteOptions {
  id: string
  runId: string
  runTestFile: RunTestFileData
  title: string
  tests: {
    id: string
    title: string
  }[]
}

export async function createTestSuite (ctx: Context, options: CreateTestSuiteOptions) {
  const testSuite: TestSuiteData = {
    id: options.id,
    slug: slugify(options.title),
    runId: options.runId,
    runTestFile: options.runTestFile,
    title: options.title,
    status: 'in_progress',
    duration: null,
    tests: [],
  }
  testSuites.push(testSuite)
  testSuite.tests = await Promise.all(options.tests.map(t => createTest(ctx, {
    id: t.id,
    runId: options.runId,
    testSuite,
    title: t.title,
  })))
  ctx.pubsub.publish(TestSuiteAdded, {
    testSuite,
  } as TestSuiteAddedPayload)
  return testSuite
}

export function getTestSuite (ctx: Context, id: string) {
  const testSuite = testSuites.find(s => s.id === id)
  if (!testSuite) {
    throw new Error(`Test suite ${id} not found`)
  }
  return testSuite
}

export async function updateTestSuite (ctx: Context, id: string, data: Partial<Omit<TestSuiteData, 'id' | 'runId' | 'testFileId'>>) {
  const testSuite = await getTestSuite(ctx, id)
  Object.assign(testSuite, data)
  ctx.pubsub.publish(TestSuiteUpdated, {
    testSuite,
  } as TestSuiteUpdatedPayload)
  return testSuite
}

export function clearTestSuites (ctx: Context, runId: string = null) {
  testSuites = runId ? testSuites.filter(s => s.runId !== runId) : []
}

function findSuiteInPreviousErrorFiles (run: RunData, suiteSlug: string) {
  for (const rf of run.previousErrorRunTestFiles) {
    const s = testSuites.find(s => s.runId === rf.runId && s.slug === suiteSlug)
    if (s) {
      return s
    }
  }
  return null
}
