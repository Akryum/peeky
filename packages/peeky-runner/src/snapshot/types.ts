export interface Snapshot {
  id: string
  testFile: string
  title: string
  content: string
  newContent?: string
  error?: Error
  visited?: boolean
}
