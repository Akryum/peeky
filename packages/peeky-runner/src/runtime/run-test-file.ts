import { install as installSourceMap } from 'source-map-support'
import consola from 'consola'
import { workerEmit } from '@akryum/workerpool'
import { CoverageInstrumenter } from 'collect-v8-coverage'
import fs from 'fs-extra'
import pragma from 'pragma'
import { InstantiableTestEnvironmentClass } from '@peeky/config'
import type { Context, RunTestFileOptions, TestSuiteResult } from '../types'
import { EventType } from '../types.js'
import { executeWithVite, initViteServer } from './vite.js'
import { getGlobals } from './globals.js'
import { runTests } from './run-tests.js'
import { setupRegister } from './test-register.js'
import { getCoverage } from './coverage.js'
import { mockedModules } from './mocked-files.js'
import { getTestEnvironment, NodeEnvironment } from './environment.js'
import { createMockedFileSystem } from './fs.js'

export async function runTestFile (options: RunTestFileOptions) {
  try {
    const time = Date.now()

    const source = await fs.readFile(options.entry, { encoding: 'utf8' })

    const ctx: Context = {
      options,
      suites: [],
      pragma: pragma(source),
    }

    // Restore mocked module
    mockedModules.clear()

    // Build
    const buildTime = Date.now()
    workerEmit(EventType.BUILDING, {
      testFilePath: ctx.options.entry,
    })
    await initViteServer({
      configFile: options.config.viteConfigFile,
      defaultConfig: {},
      rootDir: options.config.targetDirectory,
      userInlineConfig: options.config.vite,
      exclude: options.config.buildExclude,
      include: options.config.buildInclude,
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

    // Runtime env
    const runtimeEnvOption = ctx.pragma.peeky?.runtimeEnv ?? options.config.runtimeEnv
    let RuntimeEnv: InstantiableTestEnvironmentClass
    if (typeof runtimeEnvOption === 'string') {
      RuntimeEnv = getTestEnvironment(runtimeEnvOption, options.config)
    } else if (runtimeEnvOption) {
      RuntimeEnv = runtimeEnvOption
    } else {
      RuntimeEnv = NodeEnvironment
    }
    const runtimeEnv = new RuntimeEnv(options.config, {
      testPath: options.entry,
      pragma: ctx.pragma,
    })
    await runtimeEnv.create()

    let ufs
    if ((options.config.mockFs && ctx.pragma.peeky?.mockFs !== false) || ctx.pragma.peeky?.mockFs) {
      ufs = createMockedFileSystem()
    }

    // Execute test file
    const executionResult = await executeWithVite(options.entry, getGlobals(ctx, register))

    // Register suites and tests
    await register.run()

    const instrumenter = new CoverageInstrumenter()
    await instrumenter.startInstrumenting()

    // Run all tests in the test file
    if (ufs) ufs._enabled = true
    await runTests(ctx)
    await new Promise(resolve => setImmediate(resolve))
    if (ufs) ufs._enabled = false
    const duration = Date.now() - time

    const coverage = await getCoverage(await instrumenter.stopInstrumenting(), ctx)

    await runtimeEnv.destroy()

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
