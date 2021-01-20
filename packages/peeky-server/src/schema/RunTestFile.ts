import { extendType, nonNull, objectType } from 'nexus'
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
    t.nonNull.field('testFile', {
      type: TestFile,
    })
    t.nonNull.field('status', {
      type: Status,
    })
    t.int('duration')
    t.nonNull.list.field('suites', {
      type: nonNull(TestSuite),
      resolve: (parent) => testSuites.filter(s => s.runId === parent.runId && s.runTestFileId === parent.id),
    })
  },
})

const RunTestFileUpdated = 'run-updated'

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
  runId: string
  testFile: TestFileData
  status: StatusEnum
  duration: number
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
