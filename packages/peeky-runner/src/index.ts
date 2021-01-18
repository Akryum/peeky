import { join, relative } from 'path'
import workerpool from '@akryum/workerpool'
import { createReactiveFileSystem } from '@peeky/reactive-fs'
import type { RunTestFileOptions, runTestFile as rawRunTestFile, TestSuiteInfo } from './runner'
import consola from 'consola'
import chalk from 'chalk'

export interface RunnerOptions {
  targetDirectory: string
  match?: string | string[]
  ignored?: string | string[]
}

interface Context {
  options: RunnerOptions
}

export const defaultRunTestsOptions: Partial<RunnerOptions> = {
  match: '**/*.(spec|test).(ts|js)',
  ignored: ['node_modules'],
}

type EventHandler = (eventType: string, payload: any) => unknown

export async function setupRunner (options: RunnerOptions) {
  options = Object.assign({}, defaultRunTestsOptions, options)
  const ctx: Context = {
    options,
  }

  const pool = workerpool.pool(join(__dirname, 'worker.js'))

  const fsTime = Date.now()
  const testFiles = await createReactiveFileSystem({
    baseDir: ctx.options.targetDirectory,
    glob: ctx.options.match,
    ignored: ctx.options.ignored,
  })
  consola.info(`FS initialized in ${Date.now() - fsTime}ms`)

  const eventHandlers: EventHandler[] = []

  async function runTestFileWorker (options: RunTestFileOptions): ReturnType<typeof rawRunTestFile> {
    const suiteMap: { [id: string]: TestSuiteInfo } = {}
    return pool.exec('runTestFile', [options], {
      on: (eventType, payload) => {
        if (eventType === 'test-file:build-completed') {
          const { testFilePath, duration } = payload
          consola.info(`Built ${relative(ctx.options.targetDirectory, testFilePath)} in ${duration}ms`)
        } else if (eventType === 'suite:start') {
          const suite: TestSuiteInfo = payload.suite
          consola.start(suite.title)
          suiteMap[suite.id] = suite
        } else if (eventType === 'suite:completed') {
          const { duration } = payload
          const suite = suiteMap[payload.suite.id]
          consola.log(chalk[payload.suite.errors ? 'red' : 'green'](`  ${suite.tests.length - payload.suite.errors} / ${suite.tests.length} tests passed: ${suite.title} ${chalk.grey(`(${duration}ms)`)}`))
        } else if (eventType === 'test:error') {
          const { duration, error, stack } = payload
          const suite = suiteMap[payload.suite.id]
          const test = suite.tests.find(t => t.id === payload.test.id)
          consola.log(chalk.red(`  ❌️${test.title} ${chalk.grey(`(${duration}ms)`)}`))
          consola.error({ ...error, stack })
        } else if (eventType === 'test:success') {
          const { duration } = payload
          const suite = suiteMap[payload.suite.id]
          const test = suite.tests.find(t => t.id === payload.test.id)
          consola.log(chalk.green(`  ✔️ ${test.title} ${chalk.grey(`(${duration}ms)`)}`))
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

  async function runTestFile (relativePath: string) {
    const file = testFiles.files[relativePath]
    if (file) {
      const result = await runTestFileWorker({
        entry: file.absolutePath,
      })

      // Patch filePath
      result.suites.forEach(s => {
        s.filePath = relative(ctx.options.targetDirectory, s.filePath)
      })

      return result
    }
  }

  async function close () {
    await testFiles.destroy()
    await pool.terminate()
    eventHandlers.length = 0
  }

  return {
    testFiles,
    runTestFile,
    close,
    onEvent,
    pool,
  }
}

export async function runAllTests (options) {
  const runner = await setupRunner(options)

  const fileList = runner.testFiles.list()

  consola.info(`Found ${fileList.length} test files.`)

  const time = Date.now()
  const result = await Promise.all(fileList.map(f => runner.runTestFile(f)))

  consola.info(`Ran ${fileList.length} tests files (${Date.now() - time}ms, using ${runner.pool.stats().totalWorkers} parallel workers)`)

  let suiteCount = 0
  let errorSuiteCount = 0
  let testCount = 0
  let errorTestCount = 0
  for (const file of result) {
    suiteCount += file.suites.length
    for (const suite of file.suites) {
      if (suite.errors) {
        errorSuiteCount++
      }
      testCount += suite.tests.length
      errorTestCount += suite.errors
    }
  }

  consola.log(chalk[errorTestCount ? 'red' : 'green'](`Suites : ${suiteCount - errorSuiteCount} / ${suiteCount}\nTests  : ${testCount - errorTestCount} / ${testCount}`))

  await runner.close()

  return {
    result,
    suiteCount,
    errorSuiteCount,
    testCount,
    errorTestCount,
  }
}
