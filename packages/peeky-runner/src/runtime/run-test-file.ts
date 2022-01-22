import { performance } from 'perf_hooks'
import { resolve, relative } from 'pathe'
import { install as installSourceMap } from 'source-map-support'
import consola from 'consola'
import { CoverageInstrumenter } from 'collect-v8-coverage'
import fs from 'fs-extra'
import pragma from 'pragma'
import expect from 'expect'
import { InstantiableTestEnvironmentClass, mergeConfig } from '@peeky/config'
import type { Context, ReporterTest, ReporterTestSuite, RunTestFileOptions, Test, TestSuite } from '../types'
import { useVite } from './vite.js'
import { getGlobals } from './globals.js'
import { runTests } from './run-tests.js'
import { setupTestCollector } from './collect-tests.js'
import { FileCoverage, getCoverage } from './coverage.js'
import { mockedModules } from './mocked-files.js'
import { getTestEnvironment, NodeEnvironment } from './environment.js'
import { createMockedFileSystem } from './fs.js'
import { moduleCache, sourceMaps } from './module-cache.js'
import { baseConfig, setupWorker } from './setup.js'
import { toMainThread } from './message.js'
import { setCurrentTestFile } from './global-context.js'
import { SnapshotMatcher } from '../snapshot/matcher.js'

const snapshotMatcher = new SnapshotMatcher()
expect.extend({
  toMatchSnapshot: snapshotMatcher.toMatchSnapshot.bind(snapshotMatcher),
})

export async function runTestFile (options: RunTestFileOptions) {
  try {
    setCurrentTestFile(relative(options.config.targetDirectory, options.entry))
    const time = performance.now()
    await setupWorker()

    const config = mergeConfig(baseConfig, options.config)

    if (options.clearDeps) {
      options.clearDeps.forEach(file => moduleCache.delete(file))
    }

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
      snapshots: [],
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
    const collector = setupTestCollector(ctx)

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
        await executeWithVite(fullPath, await getGlobals(ctx, collector), config.targetDirectory)
      }
    }

    // Execute test file
    const executionResult = await executeWithVite(options.entry, await getGlobals(ctx, collector), config.targetDirectory)

    // Register suites and tests
    await collector.collect()

    // Snapshots
    await snapshotMatcher.start(ctx)

    let instrumenter: CoverageInstrumenter
    if (config.collectCoverage) {
      instrumenter = new CoverageInstrumenter()
      await instrumenter.startInstrumenting()
    }

    // Run all tests in the test file
    if (ufs) ufs._enabled = true
    await runTests(ctx, !options.updateSnapshots)
    if (ufs) ufs._enabled = false

    let coverage: FileCoverage[]
    if (config.collectCoverage) {
      coverage = await getCoverage(await instrumenter.stopInstrumenting(), ctx)
    } else {
      coverage = []
    }

    const {
      failedSnapshots,
      newSnapshots,
      passedSnapshots,
    } = await snapshotMatcher.end(options.updateSnapshots)

    await runtimeEnv.destroy()

    const duration = performance.now() - time

    // Result data
    const suites = ctx.suites.map(s => mapSuiteResult(s))

    await toMainThread().testFileCompleteHandshake()

    return {
      filePath: options.entry,
      suites,
      duration,
      coverage,
      deps: executionResult.deps.concat(options.entry),
      failedSnapshots,
      newSnapshots,
      passedSnapshots,
    }
  } catch (e) {
    consola.error(`Running tests failed: ${e.stack}`)
    throw e
  } finally {
    setCurrentTestFile(null)
  }
}

function mapTestResult (t: Test): ReporterTest {
  return {
    id: t.id,
    title: t.title,
    error: t.error,
    flag: t.flag,
    duration: t.duration,
  }
}

function mapSuiteResult (s: TestSuite): ReporterTestSuite {
  return {
    id: s.id,
    title: s.title,
    allTitles: s.allTitles,
    filePath: s.filePath,
    flag: s.flag,
    testErrors: s.testErrors,
    otherErrors: s.otherErrors,
    children: s.children.map(child => {
      if (child[0] === 'suite') {
        return ['suite', mapSuiteResult(child[1])]
      } else if (child[0] === 'test') {
        return ['test', mapTestResult(child[1])]
      }
      return null
    }),
    runTestCount: s.ranTests.length,
    duration: s.duration,
  }
}
