import { Context } from '../../types'
import { retry } from './test-flow'
import { mockModule } from './mock'

export function createPeekyGlobal (ctx: Context) {
  return {
    retry,
    mockModule,
  }
}

export type PeekyGlobal = ReturnType<typeof createPeekyGlobal>
