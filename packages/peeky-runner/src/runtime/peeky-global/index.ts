import { createRetry } from './test-flow.js'
import { createMockModule } from './mock.js'

export interface PeekyGlobalContext {
  filename: string
}

export function createPeekyGlobal (ctx: PeekyGlobalContext) {
  return {
    retry: createRetry(ctx),
    mockModule: createMockModule(ctx),
  }
}

export type PeekyGlobals = ReturnType<typeof createPeekyGlobal>
