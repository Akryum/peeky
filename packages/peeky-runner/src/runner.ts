import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'
import consola from 'consola'
import chalk from 'chalk'
import workerpool from '@akryum/workerpool'
import { ReactiveFileSystem } from 'reactive-fs'
import { Awaited, formatDurationToString } from '@peeky/utils'
import { SerializablePeekyConfig } from '@peeky/config'
import type { runTestFile as rawRunTestFile } from './runtime/run-test-file.js'
import type { RunTestFileOptions, TestSuiteInfo } from './types'
import { EventType } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export interface RunnerOptions {
  config: SerializablePeekyConfig
  testFiles: ReactiveFileSystem
}

interface Context {
  options: RunnerOptions
}

type EventHandler = (eventType: string, payload: any) => unknown

export async function setupRunner (options: RunnerOptions) {
  const ctx: Context = {
    options,
  }

  process.chdir(options.config.targetDirectory)

  const pool = workerpool.pool(join(__dirname, 'runtime/worker.js'), {
    ...options.config.maxWorkers ? { maxWorkers: options.config.maxWorkers } : {},
  })
  const { testFiles } = options

  const eventHandlers: EventHandler[] = []

  async function runTestFileWorker (options: RunTestFileOptions): ReturnType<typeof rawRunTestFile> {
    const suiteMap: { [id: string]: TestSuiteInfo } = {}
    return pool.exec('runTestFile', [options], {
      on: (eventType, payload) => {
        if (eventType === EventType.SUITE_START) {
          const suite: TestSuiteInfo = payload.suite
          // consola.log(chalk.blue(`START ${suite.title}`))
          suiteMap[suite.id] = suite
        } else if (eventType === EventType.SUITE_COMPLETED) {
          const { duration, suite: { testErrors, otherErrors } } = payload
          const suite = suiteMap[payload.suite.id]
          consola.log(chalk[testErrors + otherErrors.length ? 'red' : 'green'].italic(`  ${chalk.bold(suite.title)} ${suite.tests.length - testErrors} / ${suite.tests.length} tests passed ${chalk.grey(`(${formatDurationToString(duration)})`)} (${suite.filePath})`))
        } else if (eventType === EventType.TEST_ERROR) {
          const { duration, error, stack } = payload
          const suite = suiteMap[payload.suite.id]
          const test = suite.tests.find(t => t.id === payload.test.id)
          consola.log(chalk.red(`${chalk.bgRedBright.black.bold(' FAIL ')} ${suite.title} › ${chalk.bold(test.title)} ${chalk.grey(`(${formatDurationToString(duration)})`)}`))
          consola.log(`\n${stack ?? error.message}\n`)
          if (typeof payload.matcherResult === 'string') {
            payload.matcherResult = JSON.parse(payload.matcherResult)
          }
        } else if (eventType === EventType.TEST_SUCCESS) {
          const { duration } = payload
          const suite = suiteMap[payload.suite.id]
          const test = suite.tests.find(t => t.id === payload.test.id)
          consola.log(chalk.green(`${chalk.bgGreenBright.black.bold(' PASS ')} ${suite.title} › ${chalk.bold(test.title)} ${chalk.grey(`(${formatDurationToString(duration)})`)}`))
        }

        for (const handler of eventHandlers) {
          handler(eventType, payload)
        }
      },
    })
  }

  function onEvent (handler: EventHandler) {
    eventHandlers.push(handler)
  }

  function clearEventListeners () {
    eventHandlers.length = 0
  }

  async function runTestFile (relativePath: string, clearDeps: string[] = []) {
    const file = testFiles.files[relativePath]
    if (file) {
      const result = await runTestFileWorker({
        entry: file.absolutePath,
        config: ctx.options.config,
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
    await pool.terminate()
    clearEventListeners()
  }

  return {
    testFiles,
    runTestFile,
    close,
    onEvent,
    clearEventListeners,
    pool,
  }
}

export type Runner = Awaited<ReturnType<typeof setupRunner>>

export type RunTestFileResult = Awaited<ReturnType<Runner['runTestFile']>>
