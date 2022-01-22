import { relative } from 'pathe'
import { ReactiveFileSystem } from 'reactive-fs'
import Tinypool, { Options as PoolOptions } from 'tinypool'
import { Awaited } from '@peeky/utils'
import { ProgramPeekyConfig, toSerializableConfig } from '@peeky/config'
import type { runTestFile as rawRunTestFile } from './runtime/run-test-file.js'
import type { RunTestFileOptions, ReporterTestSuite, Reporter, ReporterTest } from './types'
import { initViteServer, stopViteServer, transform } from './build/vite.js'
import { createWorkerChannel, SuiteCollectData, useWorkerMessages } from './message.js'

export interface RunnerOptions {
  config: ProgramPeekyConfig
  testFiles: ReactiveFileSystem
  reporters: Reporter[]
}

interface Context {
  options: RunnerOptions
}

export async function setupRunner (options: RunnerOptions) {
  const ctx: Context = {
    options,
  }
  const { reporters } = options

  const serializableConfig = toSerializableConfig(options.config)
  const {
    onMessage,
    clearOnMessage,
    handleMessage,
  } = useWorkerMessages()

  process.chdir(options.config.targetDirectory)

  await initViteServer({
    configFile: options.config.viteConfigFile,
    defaultConfig: {},
    rootDir: options.config.targetDirectory,
    userInlineConfig: options.config.vite,
  })

  const poolOptions: PoolOptions = {
    filename: new URL('./runtime/worker.js', import.meta.url).href,
    maxThreads: options.config.maxWorkers || undefined,
    // WebContainer compatibility (Stackblitz)
    useAtomics: false,
  }

  if (options.config.isolate) {
    poolOptions.isolateWorkers = true
    poolOptions.concurrentTasksPerWorker = 1
  }

  const pool = new Tinypool(poolOptions)
  const { testFiles } = options

  async function runTestFileWorker (options: RunTestFileOptions): ReturnType<typeof rawRunTestFile> {
    const suiteMap: { [id: string]: ReporterTestSuite } = {}

    const { mainPort, workerPort } = createWorkerChannel({
      transform: async (id) => transform(id),

      onCollected: (suites) => {
        const addSuite = (suite: SuiteCollectData) => {
          suiteMap[suite.id] = suite
          for (const child of suite.children) {
            if (child[0] === 'suite') {
              addSuite(child[1])
            }
          }
        }
        for (const suite of suites) {
          addSuite(suite)
        }
      },

      onSuiteStart: ({ id }) => {
        const suite = suiteMap[id]
        reporters.forEach(r => r.suiteStart?.({ suite }))
      },

      onSuiteComplete: ({ id, testErrors, otherErrors }, duration) => {
        const suite = suiteMap[id]
        Object.assign(suite, {
          duration,
          testErrors,
          otherErrors,
        })
        reporters.forEach(r => r.suiteComplete?.({ suite }))
      },

      onTestError: (suiteId, testId, duration, error) => {
        // Parse error matcherResult
        if (typeof error.matcherResult === 'string') {
          error.matcherResult = JSON.parse(error.matcherResult)
        }

        const suite = suiteMap[suiteId]
        const [, test] = suite.children.find(([, t]) => t.id === testId) as ['test', ReporterTest]
        Object.assign(test, {
          duration,
          error,
        })
        reporters.forEach(r => r.testFail?.({ suite, test }))
      },

      onTestSuccess: (suiteId, testId, duration) => {
        const suite = suiteMap[suiteId]
        const [, test] = suite.children.find(([, t]) => t.id === testId) as ['test', ReporterTest]
        Object.assign(test, {
          duration,
        })
        reporters.forEach(r => r.testSuccess?.({ suite, test }))
      },

      onLog: (suiteId, testId, type, text, file) => {
        const suite = suiteMap[suiteId]
        const [, test] = suite?.children.find(([, t]) => t.id === testId) as ['test', ReporterTest] ?? []
        reporters.forEach(r => r.log?.({ suite, test, type, text, file }))
      },

      testFileCompleteHandshake: () => Promise.resolve(),
    }, handleMessage)

    const result = await pool.run({
      ...options,
      port: workerPort,
    }, {
      transferList: [workerPort],
    })
    mainPort.close()
    workerPort.close()
    return result
  }

  async function runTestFile (relativePath: string, clearDeps: string[] = [], updateSnapshots = false) {
    const file = testFiles.files[relativePath]
    if (file) {
      const result = await runTestFileWorker({
        entry: file.absolutePath,
        config: serializableConfig,
        coverage: {
          root: ctx.options.config.targetDirectory,
          ignored: [...ctx.options.config.match ?? [], ...ctx.options.config.ignored ?? []],
        },
        clearDeps,
        updateSnapshots,
      })

      // Patch filePath
      result.suites.forEach(s => {
        s.filePath = relative(ctx.options.config.targetDirectory, s.filePath)
      })

      return result
    }
  }

  async function close () {
    await testFiles.destroy()
    await pool.destroy()
    await stopViteServer()
    clearOnMessage()
  }

  return {
    testFiles,
    runTestFile,
    close,
    onMessage,
    clearOnMessage,
    pool,
  }
}

export type Runner = Awaited<ReturnType<typeof setupRunner>>

export type RunTestFileResult = Awaited<ReturnType<Runner['runTestFile']>>
