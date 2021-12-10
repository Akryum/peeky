import { PeekyConfig, setupConfigLoader } from '@peeky/config'

export let baseConfig: PeekyConfig

export async function setupWorker () {
  const configLoader = await setupConfigLoader()
  const config = await configLoader.loadConfig()
  await configLoader.destroy()
  baseConfig = config
}
