import vm from 'vm'
import fs from 'fs-extra'
import type { Snapshot } from './types.js'
import { generateSnapshotId, resolveSnapshotPath } from './util.js'

export async function readSnapshots (testFile: string): Promise<Snapshot[]> {
  const file = resolveSnapshotPath(testFile)
  if (!fs.existsSync(file)) {
    return []
  }
  const content = await fs.readFile(file, 'utf8')

  const exports: Record<string, string> = {}
  const context = {
    exports,
  }
  const fn = vm.runInThisContext(`(${Object.keys(context).join(',')}) => { ${content}\n }`, {
    filename: file,
  })
  fn(...Object.values(context))

  return Object.keys(exports).map(title => ({
    id: generateSnapshotId(testFile, title),
    title,
    testFile,
    content: exports[title],
  }))
}
