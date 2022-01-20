import { setupConfigLoader, toProgramConfig, runAllTests } from '@peeky/test'

const configLoader = await setupConfigLoader()
const config = await configLoader.loadConfig()
await configLoader.destroy()

const { stats: { errorSuiteCount } } = await runAllTests(toProgramConfig(config), {
  /* options here */
  quickTestFilter: 'nested',
})

if (errorSuiteCount) {
  process.exit(1)
}
