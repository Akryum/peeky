import { install as installSourceMap } from 'source-map-support'
import consola from 'consola'
import { workerEmit } from '@akryum/workerpool'
import { CoverageInstrumenter } from 'collect-v8-coverage'
import type { Context, RunTestFileOptions, TestSuiteResult } from '../types'
import { EventType } from '../types.js'
import { executeWithVite, initViteServer } from './vite.js'
import { getGlobals } from './globals.js'
import { runTests } from './run-tests.js'
import { setupRegister } from './test-register.js'
import { mockFileSystem } from './fs.js'
import { getCoverage } from './coverage.js'
import { mockedModules } from './mocked-files.js'

export async function runTestFile (options: RunTestFileOptions) {
  try {
    const ctx: Context = {
      options,
      suites: [],
    }

    const time = Date.now()

    // Restore mocked module
    mockedModules.clear()

    mockFileSystem()

    // Build
    workerEmit(EventType.BUILDING, {
      testFilePath: ctx.options.entry,
    })
    const buildTime = Date.now()
    await initViteServer({
      configFile: null,
      defaultConfig: {},
      rootDir: options.config.targetDirectory,
      shouldExternalize: null,
      userInlineConfig: {},
    })
    workerEmit(EventType.BUILD_COMPLETED, {
      testFilePath: ctx.options.entry,
      duration: Date.now() - buildTime,
    })

    // Globals
    const register = setupRegister(ctx)

    // Source map support
    installSourceMap({
      hookRequire: true,
    })

    // Execute test file
    const executionResult = await executeWithVite(options.entry, getGlobals(ctx, register))
    console.log('execution result:', executionResult)

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
      coverage,
      modules: executionResult.deps.concat(options.entry),
    }
  } catch (e) {
    consola.error(`Running tests failed: ${e.stack}`)
    throw e
  }
}
