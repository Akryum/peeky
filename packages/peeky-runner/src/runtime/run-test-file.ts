import { performance } from 'perf_hooks'
import { resolve, relative } from 'pathe'
import { install as installSourceMap } from 'source-map-support'
import consola from 'consola'
import fs from 'fs-extra'
import pragma from 'pragma'
import { expect } from 'expect'
import { InstantiableTestEnvironmentClass, mergeConfig } from '@peeky/config'
import type { Context, ReporterTest, ReporterTestSuite, RunTestFileOptions, Test, TestSuite } from '../types'
import { execute } from './execute.js'
import { getGlobals } from './globals.js'
import { runTests } from './run-tests.js'
import { setupTestCollector } from './collect-tests.js'
import { useCollectCoverage } from './coverage.js'
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
      options.clearDeps.forEach(file => {
        moduleCache.delete(file)
        moduleCache.delete(`/@fs/${file}`)
        for (const key of moduleCache.keys()) {
          const [start] = key.split('?')
          if (file.includes(start)) {
            moduleCache.delete(key)
          }
        }
      })
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
      runtimeEnv: null,
    }

    // Restore mocked module
    mockedModules.clear()

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
    const runtimeEnv = new RuntimeEnv(
      typeof runtimeEnvOption === 'string' ? runtimeEnvOption : runtimeEnvOption.envName,
      config, {
        testPath: options.entry,
        pragma: ctx.pragma,
      },
    )
    ctx.runtimeEnv = runtimeEnv
    await runtimeEnv.create()

    let ufs
    if ((config.mockFs && ctx.pragma.mockFs !== false) || ctx.pragma.mockFs) {
      ufs = createMockedFileSystem()
    }

    const files: string[] = []

    // Setup files
    if (config.setupFiles?.length) {
      for (const file of config.setupFiles) {
        files.push(resolve(config.targetDirectory, file))
      }
    }

    // Test file
    files.push(options.entry)

    // Execute setup files + test file
    await execute({
      files,
      globals: await getGlobals(ctx, collector),
      root: config.targetDirectory,
      moduleCache,
      fetchModule: toMainThread().fetchModule,
      resolveId: toMainThread().resolveId,
    })

    // Register suites and tests
    await collector.collect()

    // Snapshots
    await snapshotMatcher.start(ctx)

    let collectCoverage: ReturnType<typeof useCollectCoverage>['collect']
    if (config.collectCoverage) {
      const { start, collect } = useCollectCoverage()
      await start()
      collectCoverage = collect
    }

    // Run all tests in the test file
    if (ufs) ufs._enabled = true
    await runTests(ctx, !options.updateSnapshots)
    if (ufs) ufs._enabled = false

    if (config.collectCoverage) {
      await collectCoverage()
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
      failedSnapshots,
      newSnapshots,
      passedSnapshots,
      env: {
        name: runtimeEnv.envName,
      },
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
