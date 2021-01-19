import { arg, extendType, idArg, inputObjectType, nonNull, objectType } from 'nexus'
import shortid from 'shortid'
import { setupRunner, getStats, EventType } from '@peeky/runner'
import { Context } from '../context'
import { Status, StatusEnum } from './Status'
import { setTestFileStatus, TestFile, TestFileData, testFiles } from './TestFile'

export const Run = objectType({
  name: 'Run',
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.float('progress')
    t.nonNull.field('status', {
      type: Status,
    })
    t.nonNull.list.field('testFiles', {
      type: nonNull(TestFile),
    })
  },
})

export const RunQuery = extendType({
  type: 'Query',
  definition (t) {
    t.nonNull.list.field('runs', {
      type: nonNull(Run),
      resolve: () => runs,
    })

    t.field('run', {
      type: Run,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (_, { id }) => runs.find(r => r.id === id),
    })
  },
})

export const RunMutation = extendType({
  type: 'Mutation',
  definition (t) {
    t.nonNull.field('startRun', {
      type: Run,
      args: {
        input: arg({
          type: nonNull(StartRunInput),
        }),
      },
      resolve: async (_, { input }, ctx) => {
        const run = await createRun(ctx, {
          testFiles: input.testFileIds,
        })
        startRun(ctx, run.id)
        return run
      },
    })

    t.nonNull.field('clearRun', {
      type: Run,
      args: {
        input: arg({
          type: nonNull(ClearRunInput),
        }),
      },
      resolve: async (_, { input }, ctx) => clearRun(ctx, input.id),
    })
  },
})

export const StartRunInput = inputObjectType({
  name: 'StartRunInput',
  definition (t) {
    t.list.nonNull.string('testFileIds')
  },
})

export const ClearRunInput = inputObjectType({
  name: 'ClearRunInput',
  definition (t) {
    t.nonNull.id('id')
  },
})

const RunAdded = 'run-added'

interface RunAddedPayload {
  run: RunData
}

const RunUpdated = 'run-updated'

interface RunUpdatedPayload {
  run: RunData
}

const RunRemoved = 'run-removed'

interface RunRemovedPayload {
  run: RunData
}

export const RunSubscription = extendType({
  type: 'Subscription',

  definition (t) {
    t.field('runAdded', {
      type: nonNull(TestFile),
      subscribe: (_, args, ctx) => ctx.pubsub.asyncIterator(RunAdded),
      resolve: (payload: RunAddedPayload) => payload.run,
    })

    t.field('runUpdated', {
      type: nonNull(TestFile),
      subscribe: (_, args, ctx) => ctx.pubsub.asyncIterator(RunUpdated),
      resolve: (payload: RunUpdatedPayload) => payload.run,
    })

    t.field('runRemoved', {
      type: nonNull(TestFile),
      subscribe: (_, args, ctx) => ctx.pubsub.asyncIterator(RunRemoved),
      resolve: (payload: RunRemovedPayload) => payload.run,
    })
  },
})

export interface RunData {
  id: string
  progress: number
  status: StatusEnum
  testFiles: TestFileData[]
}

export const runs: RunData[] = []

export interface CreateRunOptions {
  testFiles: string[]
}

export async function createRun (ctx: Context, options: CreateRunOptions) {
  const run: RunData = {
    id: shortid(),
    progress: 0,
    status: 'idle',
    testFiles: options.testFiles ? testFiles.filter(f => options.testFiles.includes(f.id)) : [...testFiles],
  }
  runs.push(run)

  ctx.pubsub.publish(RunAdded, {
    run,
  } as RunAddedPayload)

  return run
}

export async function getRun (ctx: Context, id: string) {
  const run = runs.find(r => r.id === id)
  if (run) {
    return run
  } else {
    throw new Error(`Run ${id} not found`)
  }
}

export async function updateRun (ctx: Context, id: string, data: Partial<Omit<RunData, 'id'>>) {
  const run = await getRun(ctx, id)
  Object.assign(run, data)
  ctx.pubsub.publish(RunUpdated, {
    run,
  } as RunUpdatedPayload)
  return run
}

export async function startRun (ctx: Context, id: string) {
  const run = await getRun(ctx, id)

  await Promise.all(run.testFiles.map(f => setTestFileStatus(ctx, f.id, 'in_progress')))
  await updateRun(ctx, id, {
    status: 'in_progress',
  })

  const runner = await setupRunner({
    targetDirectory: process.cwd(),
    testFiles: ctx.reactiveFs,
  })
  runner.onEvent((eventType, payload) => {
    // @TODO
  })

  let completed = 0

  const results = await Promise.all(run.testFiles.map(async f => {
    const result = await runner.runTestFile(f.relativePath)
    const stats = getStats([result])
    await setTestFileStatus(ctx, f.id, stats.errorTestCount > 0 ? 'error' : 'success')
    completed++
    await updateRun(ctx, run.id, {
      progress: completed / run.testFiles.length,
    })
    return result
  }))

  const stats = getStats(results)
  await updateRun(ctx, id, {
    status: stats.errorTestCount > 0 ? 'error' : 'success',
  })

  return run
}

export async function clearRun (ctx: Context, id: string) {
  const run = await getRun(ctx, id)
  if (run.status === 'in_progress') {
    throw new Error(`Run ${id} is in progress and can't be cleared`)
  }
  const index = runs.indexOf(run)
  if (index !== -1) {
    runs.splice(index, 1)
  }
  ctx.pubsub.publish(RunRemoved, {
    run,
  } as RunRemovedPayload)
  return run
}
