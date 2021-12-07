import type { Context } from './context'
import { createRun, CreateRunOptions, startRun } from './schema/index.js'

export async function run (ctx: Context, options: CreateRunOptions) {
  const run = await createRun(ctx, options)
  await startRun(ctx, run.id)
}
