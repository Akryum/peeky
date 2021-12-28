import crypto from 'crypto'
import { basename, resolve, dirname } from 'pathe'
import { currentSuite, currentTest } from '../runtime/global-context.js'
import { Snapshot } from './types.js'

export function resolveSnapshotPath (testFile: string) {
  return resolve(dirname(testFile), '__snapshots__', `${basename(testFile)}.snap`)
}

export function generateSnapshotTitle (titleMap: Record<string, number>, hint?: string) {
  const titleBase = [currentSuite.title, currentTest.title, hint].filter(t => t != null).join(' ')
  const index = (titleMap[titleBase] ?? 0) + 1
  titleMap[titleBase] = index
  return `${titleBase} ${index}`
}

export function generateSnapshotId (testFile: string, title: string) {
  return crypto.createHash('md5').update(`${testFile}:${title}`).digest('hex')
}
