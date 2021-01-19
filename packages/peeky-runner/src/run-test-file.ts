import { install as installSourceMap } from 'source-map-support'
import { dirname, join } from 'path'
import consola from 'consola'
import { Context, RunTestFileOptions, TestSuiteResult } from './types'
import { buildTestFile } from './build'
import { registerGlobals } from './globals'
import { runTests } from './run-tests'

export async function runTestFile (options: RunTestFileOptions) {
  try {
    const ctx: Context = {
      options,
      suites: [],
    }
    await buildTestFile(ctx)
    registerGlobals(ctx, global)
    installSourceMap()
    require(join(dirname(ctx.options.entry), '/__output/target.js'))
    await runTests(ctx)

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
    }
  } catch (e) {
    consola.error(`Running tests failed: ${e.stack}`)
    throw e
  }
}
