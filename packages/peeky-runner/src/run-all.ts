import consola from 'consola'
import chalk from 'chalk'
import { createReactiveFileSystem } from '@peeky/reactive-fs'
import { PeekyConfig } from '@peeky/config'
import { setupRunner } from './runner'
import { getStats } from './stats'

export async function runAllTests (config: PeekyConfig) {
  const fsTime = Date.now()
  const testFiles = await createReactiveFileSystem({
    baseDir: config.targetDirectory,
    glob: config.match,
    ignored: config.ignored,
  })
  consola.info(`FS initialized in ${Date.now() - fsTime}ms`)

  const runner = await setupRunner({
    targetDirectory: config.targetDirectory,
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
