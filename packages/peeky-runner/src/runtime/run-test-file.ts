import { performance } from 'perf_hooks'
import { resolve, relative } from 'pathe'
import { install as installSourceMap } from 'source-map-support'
import consola from 'consola'
import { CoverageInstrumenter } from 'collect-v8-coverage'
import fs from 'fs-extra'
import pragma from 'pragma'
import { InstantiableTestEnvironmentClass, mergeConfig } from '@peeky/config'
import type { Context, ReporterTestSuite, RunTestFileOptions } from '../types'
import { useVite } from './vite.js'
import { getGlobals } from './globals.js'
import { runTests } from './run-tests.js'
import { setupRegister } from './test-register.js'
import { getCoverage } from './coverage.js'
import { mockedModules } from './mocked-files.js'
import { getTestEnvironment, NodeEnvironment } from './environment.js'
import { createMockedFileSystem } from './fs.js'
import { moduleCache, sourceMaps } from './module-cache.js'
import { baseConfig, setupWorker } from './setup.js'
import { toMainThread } from './message.js'
import { setCurrentTestFile } from './global-context.js'

export async function runTestFile (options: RunTestFileOptions) {
  try {
    setCurrentTestFile(relative(options.config.targetDirectory, options.entry))
    const time = performance.now()
    await setupWorker()

    const config = mergeConfig(baseConfig, options.config)

    options.clearDeps.forEach(file => moduleCache.delete(file))

    const source = await fs.readFile(options.entry, { encoding: 'utf8' })

    let pragmaObject: Record<string, any>

    try {
      const index = source.indexOf('/* @peeky')
      if (index !== -1) {
        const endIndex = source.indexOf('*/', index)
        if (endIndex !== -1) {
          pragmaObject = pragma(source.substring(index, endIndex + 2)).peeky
        }
      }
    } catch (e) {
      consola.warn(`Failed to parse pragma for ${options.entry}: ${e.message}`)
    }

    const ctx: Context = {
      options,
      suites: [],
      pragma: pragmaObject ?? {},
    }

    // Restore mocked module
    mockedModules.clear()

    // Build
    const { executeWithVite } = useVite({
      rootDir: config.targetDirectory,
      exclude: config.buildExclude,
      include: config.buildInclude,
    }, (id) => toMainThread().transform(id))

    // Globals
    const register = setupRegister(ctx)

    // Source map support
    installSourceMap({
      retrieveSourceMap: (source) => {
        if (sourceMaps.has(source)) {
          return {
            url: source,
            map: sourceMaps.get(source),
          }
        }
      },
    })

    // Runtime env
    const runtimeEnvOption = ctx.pragma.runtimeEnv ?? config.runtimeEnv
    let RuntimeEnv: InstantiableTestEnvironmentClass
    if (typeof runtimeEnvOption === 'string') {
      RuntimeEnv = getTestEnvironment(runtimeEnvOption, config)
    } else if (runtimeEnvOption) {
      RuntimeEnv = runtimeEnvOption
    } else {
      RuntimeEnv = NodeEnvironment
    }
    const runtimeEnv = new RuntimeEnv(config, {
      testPath: options.entry,
      pragma: ctx.pragma,
    })
    await runtimeEnv.create()

    let ufs
    if ((config.mockFs && ctx.pragma.mockFs !== false) || ctx.pragma.mockFs) {
      ufs = createMockedFileSystem()
    }

    // Setup files
    if (config.setupFiles?.length) {
      for (const file of config.setupFiles) {
        const fullPath = resolve(config.targetDirectory, file)
        await executeWithVite(fullPath, await getGlobals(ctx, register), config.targetDirectory)
      }
    }

    // Execute test file
    const executionResult = await executeWithVite(options.entry, await getGlobals(ctx, register), config.targetDirectory)

    // Register suites and tests
    await register.collect()

    const instrumenter = new CoverageInstrumenter()
    await instrumenter.startInstrumenting()

    // Run all tests in the test file
    if (ufs) ufs._enabled = true
    await runTests(ctx)
    if (ufs) ufs._enabled = false

    const coverage = await getCoverage(await instrumenter.stopInstrumenting(), ctx)

    await runtimeEnv.destroy()

    const duration = performance.now() - time

    // Result data
    const suites = ctx.suites.map(s => ({
      id: s.id,
      title: s.title,
      filePath: s.filePath,
      testErrors: s.testErrors,
      otherErrors: s.otherErrors,
      tests: s.tests.map(t => ({
        id: t.id,
        title: t.title,
        error: t.error,
        flag: t.flag,
        duration: t.duration,
      })),
      runTestCount: s.ranTests.length,
      duration: s.duration,
    } as ReporterTestSuite))

    return {
      filePath: options.entry,
      suites,
      duration,
      coverage,
      deps: executionResult.deps.concat(options.entry),
    }
  } catch (e) {
    consola.error(`Running tests failed: ${e.stack}`)
    throw e
  } finally {
    setCurrentTestFile(null)
  }
}
