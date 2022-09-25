import fs from 'fs-extra'
import * as path from 'pathe'
import createReport from 'c8/lib/report.js'
import type { C8Options } from '@peeky/config'

export async function clearCoverageTemp (): Promise<void> {
  const dir = path.join(process.cwd(), `node_modules/.temp/coverage`)
  await fs.emptyDir(dir)
}

export async function reportCoverage (options: C8Options) {
  const dir = path.join(process.cwd(), `node_modules/.temp/coverage`)
  const report = createReport({
    ...options,
    tempDirectory: dir,
  })
  await report.run()
}
