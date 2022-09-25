import { relative, resolve } from 'pathe'
import fs from 'fs-extra'
import Tinypool, { Options as PoolOptions } from 'tinypool'
import { createServer, mergeConfig } from 'vite'
import { ViteNodeServer } from 'vite-node/server'
import { Awaited } from '@peeky/utils'
import { ProgramPeekyConfig, toSerializableConfig } from '@peeky/config'
import type { runTestFile as rawRunTestFile } from './runtime/run-test-file.js'
import type { RunTestFileOptions, ReporterTestSuite, Reporter, ReporterTest } from './types'
import { createWorkerChannel, SuiteCollectData, useWorkerMessages } from './message.js'
import { clearCoverageTemp } from './coverage.js'

export interface RunnerOptions {
  config: ProgramPeekyConfig
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

  await clearCoverageTemp()

  const viteServer = await createServer(mergeConfig(options.config.vite ?? {}, {
    logLevel: 'error',
    clearScreen: false,
    configFile: options.config.viteConfigFile,
    root: options.config.targetDirectory,
    resolve: {},
  }))
  await viteServer.pluginContainer.buildStart({})
  const viteNode = new ViteNodeServer(viteServer)

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

  async function runTestFileWorker (options: RunTestFileOptions): Promise<Awaited<ReturnType<typeof rawRunTestFile>> & { deps: string[] }> {
    const suiteMap: { [id: string]: ReporterTestSuite } = {}

    const { mainPort, workerPort } = createWorkerChannel({
      fetchModule: async (id) => {
        if (id.match(/\.json$/)) {
          if (id.startsWith('/')) {
            id = id.substring(1)
          }
          id = resolve(options.config.targetDirectory, id)
          const code = `const data = ${await fs.readFile(id, { encoding: 'utf8' })};Object.assign(exports, data);exports.default = data;`
          return {
            code,
            map: null,
          }
        }
        return viteNode.fetchModule(id)
      },

      resolveId: async (id, importer) => viteNode.resolveId(id, importer),

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

      onSuiteComplete: ({ id, testErrors, otherErrors }, duration, completedTests) => {
        const suite = suiteMap[id]
        Object.assign(suite, {
          duration,
          testErrors,
          otherErrors,
        })
        for (const id in completedTests) {
          const test = suite.children.find(c => c[0] === 'test' && c[1].id === id)[1]
          Object.assign(test, {
            duration: completedTests[id],
          })
        }
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

    // Collect dependencies
    const deps = new Set<string>()
    const addImports = async (filepath: string) => {
      const transformed = await viteNode.transformRequest(filepath)
      if (!transformed) { return }
      const dependencies = [...transformed.deps ?? [], ...transformed.dynamicDeps ?? []]
      for (const dep of dependencies) {
        const path = await viteServer.pluginContainer.resolveId(dep, filepath, { ssr: true })
        const fsPath = path && !path.external && path.id.split('?')[0]
        if (fsPath && !fsPath.includes('node_modules') && !fsPath.includes('packages/peeky') && !deps.has(fsPath) && fs.existsSync(fsPath)) {
          deps.add(fsPath)
          await addImports(fsPath)
        }
      }
    }
    await addImports(options.entry)
    deps.add(options.entry)
    result.deps = Array.from(deps)

    mainPort.close()
    workerPort.close()

    return result
  }

  async function runTestFile (relativePath: string, clearDeps: string[] = [], updateSnapshots = false) {
    const file = resolve(ctx.options.config.targetDirectory, relativePath)
    if (fs.existsSync(file)) {
      const result = await runTestFileWorker({
        entry: file,
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
    await pool.destroy()
    await viteServer.close()
    clearOnMessage()
  }

  return {
    runTestFile,
    close,
    onMessage,
    clearOnMessage,
    pool,
    viteServer,
  }
}

export type Runner = Awaited<ReturnType<typeof setupRunner>>

export type RunTestFileResult = Awaited<ReturnType<Runner['runTestFile']>>
