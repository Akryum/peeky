import { setupConfigLoader, mergeConfig, PeekyConfig } from '@peeky/config'
import { runAllTests } from '@peeky/runner'
import { createServer } from '@peeky/server'
import { pick } from 'lodash'
import consola from 'consola'
import openInBrowser from 'open'
import portfinder from 'portfinder'

export { defineConfig } from '@peeky/config'

export const run = async (options) => {
  try {
    const configLoader = await setupConfigLoader()
    const config = await configLoader.loadConfig()
    await configLoader.destroy()
    const finalConfig = mergeConfig(config, (pick<any>(options, [
      'match',
      'ignore',
    ]) as PeekyConfig))

    const { stats: { errorSuiteCount } } = await runAllTests(finalConfig)

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

export const open = async (options) => {
  try {
    const {
      http,
    } = await createServer()
    const port = options.port ?? process.env.PORT ?? await portfinder.getPortPromise({
      startPort: 5000,
    })
    http.listen(port, () => {
      const url = `http://localhost:${port}`
      consola.success(`🚀 Server ready at ${url}`)
      openInBrowser(url)
    })
  } catch (e) {
    consola.error(e)
    process.exit(1)
  }
}
