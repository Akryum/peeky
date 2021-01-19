import { extendType, idArg, nonNull, objectType } from 'nexus'
import { Context } from '../context'
import { Status, StatusEnum } from './Status'

export const TestFile = objectType({
  name: 'TestFile',
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.string('relativePath')
    t.nonNull.field('status', {
      type: Status,
    })
    t.nonNull.boolean('deleted')
  },
})

export const TestFileQuery = extendType({
  type: 'Query',
  definition (t) {
    t.nonNull.list.field('testFiles', {
      type: nonNull(TestFile),
      resolve: () => testFiles,
    })

    t.field('testFile', {
      type: TestFile,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (_, { id }) => testFiles.find(t => t.id === id),
    })
  },
})

const TestFileAdded = 'test-file-added'

interface TestFileAddedPayload {
  testFile: TestFileData
}

const TestFileUpdated = 'test-file-updated'

interface TestFileUpdatedPayload {
  testFile: TestFileData
}

const TestFileRemoved = 'test-file-removed'

interface TestFileRemovedPayload {
  testFile: TestFileData
}

export const TestFileSubscription = extendType({
  type: 'Subscription',

  definition (t) {
    t.field('testFileAdded', {
      type: nonNull(TestFile),
      subscribe: (_, args, ctx) => ctx.pubsub.asyncIterator(TestFileAdded),
      resolve: (payload: TestFileAddedPayload) => payload.testFile,
    })

    t.field('testFileUpdated', {
      type: nonNull(TestFile),
      subscribe: (_, args, ctx) => ctx.pubsub.asyncIterator(TestFileUpdated),
      resolve: (payload: TestFileUpdatedPayload) => payload.testFile,
    })

    t.field('testFileRemoved', {
      type: nonNull(TestFile),
      subscribe: (_, args, ctx) => ctx.pubsub.asyncIterator(TestFileRemoved),
      resolve: (payload: TestFileRemovedPayload) => payload.testFile,
    })
  },
})

export interface TestFileData {
  id: string
  relativePath: string
  status: StatusEnum
  deleted: boolean
}

export let testFiles: TestFileData[] = []

export async function loadTestFiles (ctx: Context) {
  testFiles = ctx.reactiveFs.list().map(path => createTestFile(path))

  ctx.reactiveFs.onFileAdd((relativePath) => {
    const testFile = createTestFile(relativePath)
    testFiles.push(testFile)
    ctx.pubsub.publish(TestFileAdded, {
      testFile: testFile,
    } as TestFileAddedPayload)
  })

  ctx.reactiveFs.onFileRemove((relativePath) => {
    const testFile = testFiles.find(f => f.relativePath === relativePath)
    if (testFile) {
      testFile.deleted = true
      ctx.pubsub.publish(TestFileRemoved, {
        testFile,
      } as TestFileRemovedPayload)
    }
  })
}

export async function setTestFileStatus (ctx: Context, id: string, status: StatusEnum) {
  const testFile = testFiles.find(f => f.id === id)
  if (testFile) {
    testFile.status = status
    ctx.pubsub.publish(TestFileUpdated, {
      testFile,
    } as TestFileUpdatedPayload)
  }
}

function createTestFile (relativePath: string): TestFileData {
  return {
    id: relativePath,
    relativePath,
    status: 'idle',
    deleted: false,
  }
}
