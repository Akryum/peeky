import fs from 'fs-extra'
import * as path from 'pathe'
import consola from 'consola'
import { nanoid } from 'nanoid'
import { fixWindowsAbsoluteFileUrl } from '@peeky/utils'
import type { PeekyConfig } from './types'
import { transformConfigCode } from './transform.js'
import { defaultPeekyConfig } from './defaults.js'
import { mergeConfig } from './util.js'
import { processConfig } from './process.js'

export interface PeekyConfigLoaderOptions {
  baseDir?: string
  glob?: string | string[]
}

const configFileNames = [
  'peeky.config.ts',
  'peeky.config.js',
  '.peeky.ts',
  '.peeky.js',
]

export function resolveConfigFile (cwd: string = process.cwd()): string {
  let { root } = path.parse(cwd)
  let dir = cwd

  // Fix for windows, waiting for pathe to fix this: https://github.com/unjs/pathe/issues/5
  if (root === '' && dir[1] === ':') {
    root = dir.substring(0, 2)
  }

  while (dir !== root) {
    for (const fileName of configFileNames) {
      const searchPath = path.join(dir, fileName)
      if (fs.existsSync(searchPath)) {
        return searchPath
      }
    }
    dir = path.dirname(dir)
  }

  return null
}

export async function setupConfigLoader (options: PeekyConfigLoaderOptions = {}) {
  async function loadConfig (loadFromVite = true): Promise<PeekyConfig> {
    const cwd = options.baseDir || process.cwd()
    const file = await resolveConfigFile(cwd)
    const resolvedPath = file + nanoid() + '.temp.mjs'
    try {
      let config: PeekyConfig = {}

      if (file) {
        const rawCode = await fs.readFile(file, 'utf8')
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
    // noop
  }

  return {
    loadConfig,
    destroy,
  }
}
