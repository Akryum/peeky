import { fileURLToPath } from 'url'
import { arg, extendType, idArg, inputObjectType, nonNull, objectType } from 'nexus'
import { readSnapshots, Snapshot as RunnerSnapshot, writeSnapshots } from '@peeky/runner'
import type { Context } from '../context.js'
import { TestData } from './Test.js'
import { getErrorPosition, getSrcFile } from '../util.js'
import { TestFileData } from './TestFile.js'
import { runs } from './Run.js'

const __filename = fileURLToPath(import.meta.url)

export const Snapshot = objectType({
  name: 'Snapshot',
  sourceType: {
    module: getSrcFile(__filename),
    export: 'SnapshotData',
  },
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.string('title')
    t.nonNull.string('content')
    t.string('newContent')
    t.int('line')
    t.int('col')
    t.boolean('updated')
    t.nonNull.boolean('failed', {
      resolve: snapshot => !!snapshot.newContent && !snapshot.updated,
    })
    t.nonNull.field('test', {
      type: 'Test',
      resolve: snapshot => snapshot.test,
    })
  },
})

export const SnapshotExtendTest = extendType({
  type: 'Test',
  definition (t) {
    t.nonNull.list.nonNull.field('snapshots', {
      type: Snapshot,
    })
    t.nonNull.int('failedSnapshotCount')
    t.nonNull.int('snapshotCount', {
      resolve: (test) => test.snapshots.length,
    })
  },
})

export const SnapshotExtendRun = extendType({
  type: 'Run',
  definition (t) {
    t.nonNull.list.nonNull.field('failedSnapshots', {
      type: Snapshot,
    })
    t.nonNull.list.nonNull.field('passedSnapshots', {
      type: Snapshot,
    })
    t.nonNull.list.nonNull.field('newSnapshots', {
      type: Snapshot,
    })
    t.nonNull.int('snapshotCount', {
      resolve: run => run.passedSnapshots.length + run.newSnapshots.length + run.failedSnapshots.length,
    })
    t.nonNull.int('failedSnapshotCount', {
      resolve: run => run.failedSnapshots.length,
    })
    t.field('snapshotById', {
      type: Snapshot,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (run, { id }) => run.passedSnapshots.find(s => s.id === id) ??
        run.failedSnapshots.find(s => s.id === id) ??
        run.newSnapshots.find(s => s.id === id),
    })
    t.field('nextSnapshot', {
      type: Snapshot,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (run, { id }) => {
        const snapshots = run.passedSnapshots.concat(run.failedSnapshots, run.newSnapshots)
        let index = snapshots.findIndex(s => s.id === id) + 1
        if (index >= snapshots.length) {
          index = 0
        }
        return snapshots[index]
      },
    })
    t.field('previousSnapshot', {
      type: Snapshot,
      args: {
        id: nonNull(idArg()),
      },
      resolve: (run, { id }) => {
        const snapshots = run.passedSnapshots.concat(run.failedSnapshots, run.newSnapshots)
        let index = snapshots.findIndex(s => s.id === id) - 1
        if (index < 0) {
          index = snapshots.length - 1
        }
        return snapshots[index]
      },
    })
  },
})

export const SnapshotMutation = extendType({
  type: 'Mutation',
  definition (t) {
    t.field('updateSnapshot', {
      type: Snapshot,
      args: {
        input: arg({
          type: nonNull(UpdateSnapshotInput),
        }),
      },
      resolve: async (_, { input }, ctx) => {
        const snapshot = getSnapshot(input.id)
        await updateSnapshot(ctx, snapshot)
        snapshot.updated = true
        snapshot.test.failedSnapshotCount--

        const run = runs[runs.length - 1]
        const index = run.failedSnapshots.indexOf(snapshot)
        if (index !== -1) {
          run.failedSnapshots.splice(index, 1)
        }
        if (!run.passedSnapshots.includes(snapshot)) {
          run.passedSnapshots.push(snapshot)
        }

        return snapshot
      },
    })
  },
})

export const UpdateSnapshotInput = inputObjectType({
  name: 'UpdateSnapshotInput',
  definition (t) {
    t.nonNull.id('id')
  },
})

export interface SnapshotData {
  id: string
  title: string
  content: string
  testFile: string
  newContent?: string
  line?: number
  col?: number
  updated?: boolean
  test: TestData
}

let snapshots: SnapshotData[] = []

export function getSnapshot (id: string): SnapshotData {
  return snapshots.find(s => s.id === id)
}

export function clearSnapshots () {
  snapshots = []
}

export function addSnapshots (s: SnapshotData[]) {
  snapshots.push(...s)
}

export async function updateSnapshot (ctx: Context, snapshot: SnapshotData) {
  const snapshots = await readSnapshots(snapshot.testFile)
  const existingSnapshot = snapshots.find(s => s.id === snapshot.id)
  Object.assign(existingSnapshot, {
    newContent: snapshot.newContent,
  })
  await writeSnapshots(snapshot.testFile, snapshots, true)
}

export function toSnapshotData (s: RunnerSnapshot, test: TestData, testFile: TestFileData): SnapshotData {
  const result: SnapshotData = {
    ...s,
    test,
  }
  if (s.error) {
    const { line, col } = getErrorPosition(testFile.relativePath, s.error.stack)
    Object.assign(result, {
      line,
      col,
    })
  }
  return result
}
