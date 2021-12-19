import { setupConfigLoader, mergeConfig, PeekyConfig, toProgramConfig } from '@peeky/config'
import { runAllTests } from '@peeky/runner'
import pick from 'lodash/pick.js'
import consola from 'consola'
import { performance } from 'perf_hooks'

export async function run (quickFilter: string, options) {
  try {
    const time = performance.now()
    const configLoader = await setupConfigLoader()
    const config = await configLoader.loadConfig()
    await configLoader.destroy()
    const finalConfig = mergeConfig(config, (pick<any>(options, [
      'match',
      'ignore',
    ]) as PeekyConfig))
    consola.info('Setup done in', (performance.now() - time).toFixed(2), 'ms')

    const { stats: { errorSuiteCount } } = await runAllTests(toProgramConfig(finalConfig), {
      quickTestFilter: quickFilter,
    })

    if (errorSuiteCount) {
      const e = new Error('Some tests failed')
      e.stack = e.message
      throw e
    }
  } catch (e) {
    consola.error(e)
    process.exit(1)
  }
}
