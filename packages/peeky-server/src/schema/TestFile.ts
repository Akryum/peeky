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
    t.int('duration')
  },
})

export const TestFileQuery = extendType({
  type: 'Query',
  definition (t) {
    t.nonNull.list.field('testFiles', {
      type: nonNull(TestFile),
      resolve: () => testFiles.filter(f => !f.deleted),
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
  duration: number
}

export let testFiles: TestFileData[] = []

export async function loadTestFiles (ctx: Context) {
  testFiles = ctx.reactiveFs.list().map(path => createTestFile(path))

  ctx.reactiveFs.onFileAdd(async (relativePath) => {
    let testFile: TestFileData = testFiles.find(f => f.relativePath === relativePath)
    if (testFile) {
      await updateTestFile(ctx, testFile.id, {
        deleted: false,
      })
    } else {
      testFile = createTestFile(relativePath)
      testFiles.push(testFile)
    }
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

export async function updateTestFile (ctx: Context, id: string, data: Partial<Omit<TestFileData, 'id'>>) {
  const testFile = testFiles.find(f => f.id === id)
  Object.assign(testFile, data)
  ctx.pubsub.publish(TestFileUpdated, {
    testFile,
  } as TestFileUpdatedPayload)
  return testFile
}

function createTestFile (relativePath: string): TestFileData {
  return {
    id: relativePath,
    relativePath,
    status: 'idle',
    deleted: false,
    duration: null,
  }
}
