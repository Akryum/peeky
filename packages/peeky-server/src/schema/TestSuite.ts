import { fileURLToPath } from 'url'
import { withFilter } from 'graphql-subscriptions'
import { extendType, idArg, nonNull, objectType, stringArg, unionType } from 'nexus'
import slugify from 'slugify'
import { TestFlag } from '@peeky/runner'
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
    t.nonNull.list.string('allTitles')
    t.nonNull.field('status', {
      type: Status,
    })
    t.float('duration')
    t.nonNull.field('runTestFile', {
      type: RunTestFile,
      resolve: (parent) => parent.runTestFile,
    })
    t.nonNull.list.field('children', {
      type: nonNull(unionType({
        name: 'TestSuiteChild',
        definition (t) {
          t.members('TestSuite', 'Test')
        },
        resolveType (source) {
          if ('children' in source) {
            return 'TestSuite'
          } else {
            return 'Test'
          }
        },
      })),
      resolve: suite => suite.children.slice(0, 500), // Send a bit more for search
    })
    t.nonNull.int('childCount', {
      resolve: suite => suite.children.length,
    })
    t.field('parentSuite', {
      type: TestSuite,
      resolve: suite => suite.parent,
    })
    t.nonNull.boolean('root', {
      resolve: source => !source.parent,
    })
  },
})

export const TestSuiteExtendRun = extendType({
  type: 'Run',
  definition (t) {
    t.nonNull.list.field('rootTestSuites', {
      type: nonNull(TestSuite),
      resolve: (parent) => testSuites.filter(s => s.runId === parent.id && !s.parent),
    })

    t.nonNull.list.field('allTestSuites', {
      type: nonNull(TestSuite),
      resolve: (parent) => testSuites.filter(s => s.runId === parent.id),
    })

    t.field('testSuiteById', {
      type: TestSuite,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (run, { id }) => testSuites.find(s => s.runId === run.id && s.id === id),
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

export const TestSuiteExtendQuery = extendType({
  type: 'Query',
  definition (t) {
    t.field('testSuiteById', {
      type: TestSuite,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (_, { id }) => testSuites.find(s => s.id === id),
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

export const TestSuiteCompleted = 'test-suite-completed'

export interface TestSuiteCompletedPayload {
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

    t.nonNull.field('testSuiteCompleted', {
      type: TestSuite,
      args: {
        runId: nonNull(idArg()),
        runTestFileId: idArg(),
      },
      subscribe: withFilter(
        (_, args, ctx) => ctx.pubsub.asyncIterator(TestSuiteCompleted),
        (payload: TestSuiteCompletedPayload, args) => payload.testSuite.runId === getRunId(args.runId) && (args.runTestFileId == null || payload.testSuite.runTestFile.id === args.runTestFileId),
      ),
      resolve: (payload: TestSuiteCompletedPayload) => payload.testSuite,
    })
  },
})

export interface TestSuiteData {
  id: string
  slug: string
  runId: string
  runTestFile: RunTestFileData
  title: string
  allTitles: string[]
  flag: TestFlag
  status: StatusEnum
  duration: number
  children: (TestSuiteData | TestData)[]
  parent: TestSuiteData
}

export let testSuites: TestSuiteData[] = []

export interface CreateTestSuiteData {
  id: string
  title: string
  allTitles: string[]
  flag: TestFlag
  children: (['test', CreateTestData] | ['suite', CreateTestSuiteData])[]
}

export interface CreateTestData {
  id: string
  title: string
  flag: TestFlag
}

export interface CreateTestsuiteOptions {
  runId: string
  runTestFile: RunTestFileData
  status: StatusEnum
  parent: TestSuiteData
}

export async function createTestSuite (ctx: Context, data: CreateTestSuiteData, options: CreateTestsuiteOptions) {
  const testSuite: TestSuiteData = {
    id: data.id,
    slug: slugify(data.allTitles.join('-')),
    runId: options.runId,
    runTestFile: options.runTestFile,
    title: data.title,
    allTitles: data.allTitles,
    flag: data.flag,
    status: options.status,
    duration: null,
    children: [],
    parent: options.parent,
  }
  testSuites.push(testSuite)

  const hasOnlyFlags = data.children.some(([, t]) => t.flag === 'only')

  for (const child of data.children) {
    if (child[0] === 'suite') {
      const childSuiteData = child[1]
      const childSuite = await createTestSuite(ctx, childSuiteData, {
        runId: options.runId,
        runTestFile: options.runTestFile,
        status: options.status === 'skipped' ? 'skipped' : getInitialStatus(childSuiteData, hasOnlyFlags),
        parent: testSuite,
      })
      testSuite.children.push(childSuite)
    } else if (child[0] === 'test') {
      const childTestData = child[1]
      const childTest = await createTest(ctx, {
        id: childTestData.id,
        runId: options.runId,
        testSuite,
        title: childTestData.title,
        flag: childTestData.flag,
        status: options.status === 'skipped' ? 'skipped' : getInitialStatus(childTestData, hasOnlyFlags),
      })
      testSuite.children.push(childTest)
    }
  }

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
  if (data.duration != null) {
    ctx.pubsub.publish(TestSuiteCompleted, {
      testSuite,
    } as TestSuiteCompletedPayload)
  }
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

function getInitialStatus (data: CreateTestData | CreateTestSuiteData, hasOnlyFlags: boolean) {
  return data.flag === 'todo' ? 'todo' : (hasOnlyFlags && data.flag !== 'only') || data.flag === 'skip' ? 'skipped' : 'in_progress'
}
