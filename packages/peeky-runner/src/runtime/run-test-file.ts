import { install as installSourceMap } from 'source-map-support'
import consola from 'consola'
import { workerEmit } from '@akryum/workerpool'
import mockModule from 'mock-require'
import { CoverageInstrumenter } from 'collect-v8-coverage'
import { Context, EventType, RunTestFileOptions, TestSuiteResult } from '../types'
import { buildTestFile } from './build'
import { registerGlobals } from './globals'
import { runTests } from './run-tests'
import { setupRegister } from './test-register'
import { mockFileSystem } from './fs'
import { getCoverage } from './coverage'

export async function runTestFile (options: RunTestFileOptions) {
  try {
    const ctx: Context = {
      options,
      suites: [],
    }

    const time = Date.now()

    // Restore mocked module
    mockModule.stopAll()

    mockFileSystem()

    // Build
    const {
      outputPath,
      modules,
    } = await buildTestFile(ctx)

    // Globals
    const register = setupRegister(ctx)
    registerGlobals(ctx, global, register)

    // Source map support
    installSourceMap({
      hookRequire: true,
    })

    // Execute test file
    require(outputPath)

    // Register suites and tests
    await register.run()

    const instrumenter = new CoverageInstrumenter()
    await instrumenter.startInstrumenting()

    // Run all tests in the test file
    await runTests(ctx)
    const duration = Date.now() - time

    const coverage = await getCoverage(await instrumenter.stopInstrumenting(), ctx)

    workerEmit(EventType.TEST_FILE_COMPLETED, {
      filePath: ctx.options.entry,
      duration,
    })

    // Result data
    const suites: TestSuiteResult[] = ctx.suites.map(s => ({
      id: s.id,
      title: s.title,
      filePath: s.filePath,
      testErrors: s.testErrors,
      otherErrors: s.otherErrors,
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
      coverage,
    }
  } catch (e) {
    consola.error(`Running tests failed: ${e.stack}`)
    throw e
  }
}
