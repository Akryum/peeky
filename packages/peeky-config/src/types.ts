import type { UserConfig as ViteConfig } from 'vite'

export type ExternalOption =
  | (string | RegExp)[]
  | string
  | RegExp
  | ((file: string) => boolean)

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
  external?: ExternalOption
  vite?: ViteConfig
  viteConfigFile?: string
}
