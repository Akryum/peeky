import type { StatusEnum } from '@peeky/server/src/schema'

export type TestStatus = StatusEnum

export function compareStatus (a: TestStatus, b: TestStatus): number {
  const indexA = order.indexOf(a)
  const indexB = order.indexOf(b)
  return indexA - indexB
}

const order: TestStatus[] = [
  'error',
  'in_progress',
  'todo',
  'success',
  'skipped',
]
