import { PeekyConfig } from './types'

export * from './types'
export * from './defaults'

/**
 * Type helper to make peeky.config.ts usage easier.
 */
export function defineConfig (config: PeekyConfig): PeekyConfig {
  return config
}
