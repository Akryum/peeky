import { arg, extendType, inputObjectType, nonNull, objectType } from 'nexus'
import { readSnapshots, writeSnapshots } from '@peeky/runner'
import type { Context } from '../context.js'
import { TestData } from './Test.js'

export const Snapshot = objectType({
  name: 'Snapshot',
  definition (t) {
    t.nonNull.id('id')
    t.nonNull.string('title')
    t.nonNull.string('content')
    t.string('newContent')
    t.int('line')
    t.int('col')
    t.boolean('updated')
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
        const snapshot = await getSnapshot(input.id)
        await updateSnapshot(ctx, snapshot)
        snapshot.updated = true
        snapshot.test.failedSnapshotCount--
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

export async function getSnapshot (id: string): Promise<SnapshotData> {
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
