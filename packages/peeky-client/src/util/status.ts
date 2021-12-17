import type { StatusEnum } from '@peeky/server/src/schema'

export type TestStatus = StatusEnum

export function compareStatus (a: TestStatus, b: TestStatus): number {
  const pA = isPriorityStatus(a)
  const pB = isPriorityStatus(b)
  if (pA && pA === pB) {
    return 0
  } else if (pA) {
    return -1
  } else if (pB) {
    return 1
  }

  const indexA = order.indexOf(a)
  const indexB = order.indexOf(b)
  return indexA - indexB
}

function isPriorityStatus (status: TestStatus) {
  return status === 'idle' || status === 'in_progress' || status === 'success' || status === 'error'
}

const order: TestStatus[] = [
  'skipped',
  'todo',
]
