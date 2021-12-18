import { relative } from 'path'
import consola from 'consola'
import chalk from 'chalk'
import { ReactiveFileSystem } from 'reactive-fs'
import Tinypool from 'tinypool'
import { Awaited, formatDurationToString, italic } from '@peeky/utils'
import { ProgramPeekyConfig, toSerializableConfig } from '@peeky/config'
import type { runTestFile as rawRunTestFile } from './runtime/run-test-file.js'
import type { RunTestFileOptions, TestSuiteInfo } from './types'
import { initViteServer, stopViteServer, transform } from './build/vite.js'
import { createWorkerChannel, useWorkerMessages } from './message.js'

export interface RunnerOptions {
  config: ProgramPeekyConfig
  testFiles: ReactiveFileSystem
}

interface Context {
  options: RunnerOptions
}

export async function setupRunner (options: RunnerOptions) {
  const ctx: Context = {
    options,
  }

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

  const pool = new Tinypool({
    filename: new URL('./runtime/worker.js', import.meta.url).href,
    maxThreads: options.config.maxWorkers || undefined,
  })
  const { testFiles } = options

  async function runTestFileWorker (options: RunTestFileOptions): ReturnType<typeof rawRunTestFile> {
    const suiteMap: { [id: string]: TestSuiteInfo } = {}

    const { mainPort, workerPort } = createWorkerChannel({
      transform: async (id) => transform(id),

      onSuiteStart: (suite: TestSuiteInfo) => {
        suiteMap[suite.id] = suite
      },

      onSuiteComplete: ({ id, testErrors, otherErrors }, duration) => {
        const suite = suiteMap[id]
        consola.log(italic(chalk[testErrors + otherErrors.length ? 'red' : 'green'](`  ${chalk.bold(suite.title)} ${suite.runTestCount - testErrors} / ${suite.runTestCount} tests passed ${chalk.grey(`(${formatDurationToString(duration)})`)} (${suite.filePath})`)))
      },

      onTestError: (suiteId, testId, duration, error) => {
        const suite = suiteMap[suiteId]
        const test = suite.tests.find(t => t.id === testId)
        consola.log(chalk.red(`${chalk.bgRedBright.black.bold(' FAIL ')} ${suite.title} › ${chalk.bold(test.title)} ${chalk.grey(`(${formatDurationToString(duration)})`)}`))
        consola.log(`\n${error.stack ?? error.message}\n`)
        if (typeof error.matcherResult === 'string') {
          error.matcherResult = JSON.parse(error.matcherResult)
        }
      },

      onTestSuccess: (suiteId, testId, duration) => {
        const suite = suiteMap[suiteId]
        const test = suite.tests.find(t => t.id === testId)
        consola.log(chalk.green(`${chalk.bgGreenBright.black.bold(' PASS ')} ${suite.title} › ${chalk.bold(test.title)} ${chalk.grey(`(${formatDurationToString(duration)})`)}`))
      },
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

  async function runTestFile (relativePath: string, clearDeps: string[] = []) {
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
