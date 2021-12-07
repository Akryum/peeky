import fs from 'fs'
import consola from 'consola'
import type { PeekyConfig } from './types'
import { setupConfigContentLoader } from './fs.js'
import { transformConfigCode } from './transform.js'
import { defaultPeekyConfig } from './defaults.js'
import { mergeConfig } from './util.js'
import { join } from 'path'

export interface PeekyConfigLoaderOptions {
  baseDir?: string
  glob?: string | string[]
}

export async function setupConfigLoader (options: PeekyConfigLoaderOptions = {}) {
  const contentLoader = await setupConfigContentLoader(options.baseDir, options.glob)

  async function loadConfig (): Promise<PeekyConfig> {
    const file = contentLoader.getConfigPath()
    const resolvedPath = join(options.baseDir || process.cwd(), file + '.temp.mjs')
    try {
      if (file) {
        const rawCode = await contentLoader.loadConfigFileContent()
        const result = await transformConfigCode(rawCode, file)
        fs.writeFileSync(resolvedPath, result.code)
        const config = (
          // eslint-disable-next-line no-eval
          await eval(`import('${resolvedPath}?t=${Date.now()}')`)
        ).default
        fs.unlinkSync(resolvedPath)
        return mergeConfig(defaultPeekyConfig(), config)
      } else {
        return defaultPeekyConfig()
      }
    } catch (e) {
      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath)
      }
      consola.error(e)
    }
  }

  function destroy () {
    return contentLoader.destroy()
  }

  return {
    loadConfig,
    destroy,
  }
}
