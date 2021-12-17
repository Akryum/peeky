import fs from 'fs'
import { join } from 'path'
import consola from 'consola'
import shortid from 'shortid'
import { fixWindowsAbsoluteFileUrl } from '@peeky/utils'
import type { PeekyConfig } from './types'
import { setupConfigContentLoader } from './fs.js'
import { transformConfigCode } from './transform.js'
import { defaultPeekyConfig } from './defaults.js'
import { mergeConfig } from './util.js'
import { processConfig } from './process.js'

export interface PeekyConfigLoaderOptions {
  baseDir?: string
  glob?: string | string[]
}

export async function setupConfigLoader (options: PeekyConfigLoaderOptions = {}) {
  const contentLoader = await setupConfigContentLoader(options.baseDir, options.glob)

  async function loadConfig (loadFromVite = true): Promise<PeekyConfig> {
    const file = contentLoader.getConfigPath()
    const resolvedPath = join(options.baseDir || process.cwd(), file + shortid() + '.temp.mjs')
    try {
      let config: PeekyConfig = {}

      if (file) {
        const rawCode = await contentLoader.loadConfigFileContent()
        const result = await transformConfigCode(rawCode, file)
        fs.writeFileSync(resolvedPath, result.code)
        config = (
          // eslint-disable-next-line no-eval
          await eval(`import('${fixWindowsAbsoluteFileUrl(resolvedPath)}')`)
        ).default
        fs.unlinkSync(resolvedPath)
      }

      // Integrate in vite config
      if (loadFromVite) {
        try {
          const { resolveConfig: resolveViteConfig } = await import('vite')
          const viteConfig = await resolveViteConfig({}, 'serve')
          if (viteConfig?.test) {
            config = mergeConfig(config, viteConfig.test)
          }
        } catch (e) {
          consola.error(`Failed to resolve vite config: ${e.stack ?? e.message}`)
        }
      }

      config = mergeConfig(defaultPeekyConfig(), config)

      return processConfig(config)
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
