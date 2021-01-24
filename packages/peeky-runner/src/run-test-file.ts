import { install as installSourceMap } from 'source-map-support'
import consola from 'consola'
import { Context, EventType, RunTestFileOptions, TestSuiteResult } from './types'
import { buildTestFile } from './build'
import { registerGlobals } from './globals'
import { runTests } from './run-tests'
import { workerEmit } from '@akryum/workerpool'
import mockModule from 'mock-require'

export async function runTestFile (options: RunTestFileOptions) {
  try {
    const ctx: Context = {
      options,
      suites: [],
    }
    const time = Date.now()
    mockModule.stopAll()
    const {
      outputPath,
      modules,
    } = await buildTestFile(ctx)
    registerGlobals(ctx, global)
    installSourceMap()
    require(outputPath)
    await runTests(ctx)
    const duration = Date.now() - time
    workerEmit(EventType.TEST_FILE_COMPLETED, {
      filePath: ctx.options.entry,
      duration,
    })

    const suites: TestSuiteResult[] = ctx.suites.map(s => ({
      id: s.id,
      title: s.title,
      filePath: s.filePath,
      errors: s.errors,
      tests: s.tests.map(t => ({
        id: t.id,
        title: t.title,
        error: t.error,
      })),
    }))
    return {
      filePath: options.entry,
      suites,
      duration,
      modules,
    }
  } catch (e) {
    consola.error(`Running tests failed: ${e.stack}`)
    throw e
  }
}
