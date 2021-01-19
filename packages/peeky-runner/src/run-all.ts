import { createReactiveFileSystem } from '@peeky/reactive-fs'
import consola from 'consola'
import chalk from 'chalk'
import { setupRunner } from './runner'
import { getStats } from './stats'

export interface RunAllTestsOptions {
  targetDirectory: string
  match?: string | string[]
  ignored?: string | string[]
}

export const defaultRunTestsOptions: Partial<RunAllTestsOptions> = {
  match: '**/*.(spec|test).(ts|js)',
  ignored: ['node_modules'],
}

export async function runAllTests (options: RunAllTestsOptions) {
  options = Object.assign({}, defaultRunTestsOptions, options)

  const fsTime = Date.now()
  const testFiles = await createReactiveFileSystem({
    baseDir: options.targetDirectory,
    glob: options.match,
    ignored: options.ignored,
  })
  consola.info(`FS initialized in ${Date.now() - fsTime}ms`)

  const runner = await setupRunner({
    targetDirectory: options.targetDirectory,
    testFiles,
  })

  const fileList = runner.testFiles.list()

  consola.info(`Found ${fileList.length} test files.`)

  const time = Date.now()
  const result = await Promise.all(fileList.map(f => runner.runTestFile(f)))

  consola.info(`Ran ${fileList.length} tests files (${Date.now() - time}ms, using ${runner.pool.stats().totalWorkers} parallel workers)`)

  const stats = getStats(result)
  const {
    suiteCount,
    errorSuiteCount,
    testCount,
    errorTestCount,
  } = stats
  consola.log(chalk[errorTestCount ? 'red' : 'green'](`Suites : ${suiteCount - errorSuiteCount} / ${suiteCount}\nTests  : ${testCount - errorTestCount} / ${testCount}`))

  await runner.close()

  return {
    result,
    stats,
  }
}
