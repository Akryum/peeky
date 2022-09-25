import { enumType } from 'nexus'

export const Status = enumType({
  name: 'Status',
  members: [
    'in_progress',
    'success',
    'error',
    'skipped',
    'todo',
  ],
})

export type StatusEnum = 'in_progress' | 'success' | 'error' | 'skipped' | 'todo'
