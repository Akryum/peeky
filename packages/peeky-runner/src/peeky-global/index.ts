import { Context } from '../types'
import { retry } from './test-flow'

export function createPeekyGlobal (ctx: Context) {
  return {
    retry,
  }
}

export type PeekyGlobal = ReturnType<typeof createPeekyGlobal>
