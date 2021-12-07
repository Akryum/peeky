import type { PeekyConfig } from './types'

export * from './types.js'
export * from './defaults.js'
export * from './loader.js'
export * from './util.js'

/**
 * Type helper to make peeky.config.ts usage easier.
 */
export function defineConfig (config: PeekyConfig): PeekyConfig {
  return config
}
