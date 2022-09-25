import { withFilter } from 'graphql-subscriptions'
import { arg, extendType, idArg, nonNull } from 'nexus'
import { Context } from 'vm'
import { getRunId, runs } from './Run.js'
import { tests } from './Test.js'

export const StatsExtendRun = extendType({
  type: 'Run',
  definition (t) {
    t.nonNull.int('testCount', {
      args: {
        status: arg({
          type: 'Status',
        }),
      },
      resolve: (run, { status }) => tests.filter(t => t.runId === run.id && (!status || t.status === status)).length,
    })
  },
})

export const RunStatsUpdated = 'run-stats-updated'

export interface RunStatsUpdatedPayload {
  runId: string
}

export const StatsExtendSubpscription = extendType({
  type: 'Subscription',
  definition (t) {
    t.field('runStatsUpdated', {
      type: 'Run',
      args: {
        runId: nonNull(idArg()),
      },
      subscribe: withFilter(
        (_, args, ctx) => ctx.pubsub.asyncIterator(RunStatsUpdated),
        (payload: RunStatsUpdatedPayload, args) => payload.runId === getRunId(args.runId),
      ),
      resolve: (payload: RunStatsUpdatedPayload) => runs.find(r => r.id === getRunId(payload.runId)),
    })
  },
})

export function publishRunStatsUpdated (ctx: Context, runId: string) {
  ctx.pubsub.publish(RunStatsUpdated, { runId } as RunStatsUpdatedPayload)
}
