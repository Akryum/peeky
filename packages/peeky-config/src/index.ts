import { PeekyConfig } from './types'

export * from './types'
export * from './defaults'
export * from './loader'
export * from './util'

/**
 * Type helper to make peeky.config.ts usage easier.
 */
export function defineConfig (config: PeekyConfig): PeekyConfig {
  return config
}
