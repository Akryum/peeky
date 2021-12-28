import fs from 'fs-extra'
import type { Snapshot } from './types.js'
import { SNAPSHOTS_VERSION } from './version.js'
import { resolveSnapshotPath } from './util.js'
import { dirname } from 'pathe'

export async function writeSnapshots (testFile: string, snapshots: Snapshot[], useNewContent: boolean) {
  if (!snapshots.length) return
  const content = addNewLines([
    stringifyVersion(),
    ...snapshots.map(s => stringifySnapshot(s, useNewContent)),
  ])
  const file = resolveSnapshotPath(testFile)
  await fs.ensureDir(dirname(file))
  await fs.writeFile(file, content, 'utf8')
}

function stringifyVersion () {
  return `// Peeky snapshots v${SNAPSHOTS_VERSION}`
}

function stringifySnapshot (snapshot: Snapshot, useNewContent: boolean) {
  let content: string
  if (useNewContent) {
    content = snapshot.newContent
  } else {
    content = snapshot.content
  }
  return `exports[\`${snapshot.title}\`] = \`${content ?? snapshot.content}\`;`
}

function addNewLines (lines: string[]) {
  return lines.join('\n\n')
}
