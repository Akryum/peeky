import { join, normalize } from 'pathe'
import glob from 'fast-glob'
import chokidar from 'chokidar'
import { extendType, idArg, intArg, nonNull, objectType, stringArg } from 'nexus'
import launchEditor from 'launch-editor'
import type { Context } from '../context'
import { Status, StatusEnum } from './Status.js'

export const TestFile = objectType({
  name: 'TestFile',
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.string('relativePath')
    t.nonNull.field('status', {
      type: Status,
    })
    t.nonNull.boolean('deleted')
    t.float('duration')
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

export const TestFileMutation = extendType({
  type: 'Mutation',
  definition (t) {
    t.boolean('openTestFileInEditor', {
      args: {
        id: nonNull(idArg()),
        line: nonNull(intArg()),
        col: nonNull(intArg()),
      },
      resolve: (root, { id, line, col }) => {
        const testFile = testFiles.find(f => f.id === id)
        launchEditor(`${testFile.absolutePath}:${line}:${col}`)
        return true
      },
    })

    t.boolean('openFileInEditor', {
      args: {
        path: nonNull(stringArg()),
        line: nonNull(intArg()),
        col: nonNull(intArg()),
      },
      resolve: (root, { path, line, col }) => {
        launchEditor(`${path}:${line}:${col}`)
        return true
      },
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
  absolutePath: string
  status: StatusEnum
  deleted: boolean
  duration: number
  deps: string[]
}

export let testFiles: TestFileData[] = []

export async function loadTestFiles (ctx: Context) {
  testFiles = (await glob(ctx.config.match, {
    cwd: ctx.config.targetDirectory,
    ignore: Array.isArray(ctx.config.ignored) ? ctx.config.ignored : [ctx.config.ignored],
  })).map(path => createTestFile(ctx, normalize(path)))

  const watcher = chokidar.watch(ctx.config.match, {
    cwd: ctx.config.targetDirectory,
    ignored: ctx.config.ignored,
    ignoreInitial: true,
  })

  async function onFileChange (relativePath: string) {
    relativePath = normalize(relativePath)
    let testFile: TestFileData = testFiles.find(f => f.relativePath === relativePath)
    if (testFile) {
      await updateTestFile(ctx, testFile.id, {
        deleted: false,
      })
    } else {
      testFile = createTestFile(ctx, relativePath)
      testFiles.push(testFile)
    }
    ctx.pubsub.publish(TestFileAdded, {
      testFile,
    } as TestFileAddedPayload)
  }

  watcher.on('add', file => onFileChange(file))
  watcher.on('change', file => onFileChange(file))

  watcher.on('unlink', (relativePath) => {
    relativePath = normalize(relativePath)
    const testFile = testFiles.find(f => f.relativePath === relativePath)
    if (testFile) {
      testFile.deleted = true
      ctx.pubsub.publish(TestFileRemoved, {
        testFile,
      } as TestFileRemovedPayload)
    }
  })

  async function destroy () {
    await watcher.close()
  }

  return {
    destroy,
  }
}

export async function updateTestFile (ctx: Context, id: string, data: Partial<Omit<TestFileData, 'id'>>) {
  const testFile = testFiles.find(f => f.id === id)
  Object.assign(testFile, data)
  ctx.pubsub.publish(TestFileUpdated, {
    testFile,
  } as TestFileUpdatedPayload)
  return testFile
}

function createTestFile (ctx: Context, relativePath: string): TestFileData {
  return {
    id: relativePath,
    relativePath,
    absolutePath: join(ctx.config.targetDirectory, relativePath),
    status: 'in_progress',
    deleted: false,
    duration: null,
    deps: [],
  }
}
