import { Context } from './context'
import { createRun, CreateRunOptions, startRun } from './schema'

export async function run (ctx: Context, options: CreateRunOptions) {
  const run = await createRun(ctx, options)
  await startRun(ctx, run.id)
}
