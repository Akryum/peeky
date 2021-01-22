import { extendType, nonNull, objectType, stringArg } from 'nexus'
import { Context } from '../context'
import { getSrcFile } from '../util'
import { getRun } from './Run'
import { Status, StatusEnum } from './Status'
import { TestFile, TestFileData } from './TestFile'
import { TestSuite, testSuites } from './TestSuite'

export const RunTestFile = objectType({
  name: 'RunTestFile',
  sourceType: {
    module: getSrcFile(__filename),
    export: 'RunTestFileData',
  },
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.string('slug')
    t.nonNull.field('testFile', {
      type: TestFile,
    })
    t.nonNull.field('status', {
      type: Status,
    })
    t.int('duration')
    t.int('buildDuration')
    t.nonNull.list.field('suites', {
      type: nonNull(TestSuite),
      resolve: (parent) => testSuites.filter(s => s.runTestFile === parent),
    })
    t.field('error', {
      type: RunTestFileError,
    })
  },
})

export const RunTestFileError = objectType({
  name: 'RunTestFileError',
  definition (t) {
    t.nonNull.string('message')
  },
})

export const RunTestFileExtendRun = extendType({
  type: 'Run',
  definition (t) {
    t.nonNull.list.field('runTestFiles', {
      type: nonNull(RunTestFile),
    })

    t.field('runTestFile', {
      type: RunTestFile,
      args: {
        slug: nonNull(stringArg()),
      },
      resolve: (parent, { slug }) => parent.runTestFiles.find(f => f.slug === slug),
    })
  },
})

const RunTestFileUpdated = 'run-test-file-updated'

interface RunTestFileUpdatedPayload {
  runTestFile: RunTestFileData
}

export const RunTestFileSubscription = extendType({
  type: 'Subscription',

  definition (t) {
    t.field('runTestFileUpdated', {
      type: nonNull(RunTestFile),
      subscribe: (_, args, ctx) => ctx.pubsub.asyncIterator(RunTestFileUpdated),
      resolve: (payload: RunTestFileUpdatedPayload) => payload.runTestFile,
    })
  },
})

export interface RunTestFileData {
  id: string
  slug: string
  runId: string
  testFile: TestFileData
  status: StatusEnum
  duration: number
  buildDuration: number
  error: RunTestFileErrorData
}

export interface RunTestFileErrorData {
  message: string
}

export async function updateRunTestFile (ctx: Context, runId: string, id: string, data: Partial<Omit<RunTestFileData, 'id' | 'testFile'>>) {
  const run = await getRun(ctx, runId)
  const runTestFile = run.runTestFiles.find(f => f.id === id)
  if (!runTestFile) throw new Error(`Run test file ${id} not found on run ${runId}`)
  Object.assign(runTestFile, data)
  ctx.pubsub.publish(RunTestFileUpdated, {
    runTestFile,
  } as RunTestFileUpdatedPayload)
}
