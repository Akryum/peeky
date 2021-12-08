import type { UserConfig as ViteConfig } from 'vite'

export type ModuleFilterOption =
  | (string | RegExp)[]
  | string
  | RegExp
  | ((absolutePath: string) => boolean)

export interface PeekyConfig {
  targetDirectory?: string
  match?: string | string[]
  ignored?: string | string[]
  watchMatch?: string | string[]
  watchBaseDirectory?: string
  watchIgnored?: string | string[]
  watchThrottle?: number
  maxWorkers?: number
  emptySuiteError?: boolean
  collectCoverageMatch?: string | string[]
  buildExclude?: ModuleFilterOption
  buildInclude?: ModuleFilterOption
  vite?: ViteConfig
  viteConfigFile?: string
}

declare module 'vite' {
  interface UserConfig {
    /**
     * Peeky configuration
     */
    test?: PeekyConfig
  }
}
