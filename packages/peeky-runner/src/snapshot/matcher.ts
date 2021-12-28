// @TODO prop matchers

import type { ExpectationResult } from 'expect/build/types'
import type { Plugin } from 'pretty-format'
import type { Context, Test } from '../types.js'
import type { Snapshot } from './types.js'
import { readSnapshots } from './read.js'
import { format } from './format.js'
import { currentTest } from '../runtime/global-context.js'
import { generateSnapshotId, generateSnapshotTitle } from './util.js'
import { writeSnapshots } from './write.js'
import { basename } from 'pathe'

export class SnapshotMatcher {
  ctx: Context
  existingSnapshots: Snapshot[]
  failedSnapshots: Snapshot[]
  passedSnapshots: Snapshot[]
  newSnapshots: Snapshot[]
  processedSnapshots: Snapshot[]
  currentTest: Test
  currentIndex: number
  plugins: Plugin[] = [] // @TODO serializer plugins
  titleMap: Record<string, number>

  async start (ctx: Context) {
    this.ctx = ctx
    this.existingSnapshots = await readSnapshots(this.ctx.options.entry)
    this.titleMap = {}
    this.failedSnapshots = []
    this.passedSnapshots = []
    this.newSnapshots = []
    this.processedSnapshots = []
  }

  toMatchSnapshot (received: any, propertiesMatchers: any, hint?: string): ExpectationResult {
    if (!currentTest) {
      throw new Error(`toMatchSnapshot can't be called outside of a test`)
    }

    if (typeof propertiesMatchers !== 'object') {
      hint = propertiesMatchers
    }

    if (this.currentTest !== currentTest) {
      this.currentTest = currentTest
      this.currentIndex = 1
    } else {
      this.currentIndex++
    }

    const testFile = this.ctx.options.entry

    const formattedReceived = `\n${format(received, this.plugins)}\n`

    const snapshotTitle = generateSnapshotTitle(this.titleMap, hint)

    let processedSnapshot: Snapshot
    const existingSnapshot = processedSnapshot = this.existingSnapshots.find(s => s.title === snapshotTitle)
    if (existingSnapshot) {
      existingSnapshot.visited = true
      if (existingSnapshot.content !== formattedReceived) {
        existingSnapshot.newContent = formattedReceived
        const error: any = existingSnapshot.error = new Error(`Snapshot '${snapshotTitle}' mismatch`)
        error.matcherResult = {
          expected: existingSnapshot.content,
          actual: formattedReceived,
        }

        // Stack
        const stackLines = error.stack.split('\n')
        const stackFileLine = stackLines.find(l => l.includes(basename(testFile)))
        error.stack = [stackLines[0], stackFileLine].filter(Boolean).join('\n')

        this.failedSnapshots.push(existingSnapshot)
        currentTest.failedSnapshots++
      } else {
        this.passedSnapshots.push(existingSnapshot)
      }
    } else {
      this.newSnapshots.push(processedSnapshot = {
        id: generateSnapshotId(testFile, snapshotTitle),
        title: snapshotTitle,
        testFile,
        content: formattedReceived,
      })
    }
    this.processedSnapshots.push(processedSnapshot)
    currentTest.snapshots.push(processedSnapshot)

    return {
      message: () => '',
      pass: true,
    }
  }

  async end (updateSnapshots: boolean) {
    await writeSnapshots(this.ctx.options.entry, this.processedSnapshots, updateSnapshots)

    return {
      failedSnapshots: this.failedSnapshots,
      passedSnapshots: this.passedSnapshots,
      newSnapshots: this.newSnapshots,
    }
  }
}
