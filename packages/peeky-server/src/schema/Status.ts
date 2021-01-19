import { enumType } from 'nexus'

export const Status = enumType({
  name: 'Status',
  members: [
    'idle',
    'in_progress',
    'success',
    'error',
  ],
})

export type StatusEnum = 'idle' | 'in_progress' | 'success' | 'error'
