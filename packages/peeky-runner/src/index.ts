import { join, relative } from 'path'
import workerpool from 'workerpool'
import { createReactiveFileSystem } from '@peeky/reactive-fs'
import type { RunTestFileOptions, runTestFile as rawRunTestFile } from './runner'

export interface RunnerOptions {
  targetDirectory: string
  glob?: string | string[]
  ignored?: string | string[]
  watch?: boolean
}

interface Context {
  options: RunnerOptions
}

export const defaultRunTestsOptions: Partial<RunnerOptions> = {
  glob: '**/*.(spec|test).(ts|js)',
  ignored: ['node_modules'],
}

export async function setupRunner (options: RunnerOptions) {
  options = Object.assign({}, defaultRunTestsOptions, options)
  const ctx: Context = {
    options,
  }

  const pool = workerpool.pool(join(__dirname, 'worker.js'))
  const functions = await pool.proxy()

  const testFiles = await createReactiveFileSystem({
    baseDir: ctx.options.targetDirectory,
    glob: ctx.options.glob,
    ignored: ctx.options.ignored,
  })

  async function runTestFileWorker (options: RunTestFileOptions): ReturnType<typeof rawRunTestFile> {
    return functions.runTestFile(options)
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

  return {
    testFiles,
    runTestFile,
  }
}

export async function runAllTests (options) {
  const runner = await setupRunner(options)
  console.log(runner.testFiles.list())
  const time = Date.now()
  const result = await Promise.all(runner.testFiles.list().map(f => runner.runTestFile(f)))

  console.log(`Executed ${runner.testFiles.list().length} tests files ${Date.now() - time}ms`)

  const hasError = result.some(f => f.suites.some(s => s.errors > 0))

  return {
    result,
    hasError,
  }
}
