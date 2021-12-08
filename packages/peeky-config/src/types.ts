import type { UserConfig as ViteConfig } from 'vite'
import { Awaitable } from '@peeky/utils'

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
  runtimeEnv?: 'node' | 'dom' | typeof TestEnvironmentBase
  runtimeAvailableEnvs?: Record<string, typeof TestEnvironmentBase>
  mockFs?: boolean
  buildExclude?: ModuleFilterOption
  buildInclude?: ModuleFilterOption
  vite?: ViteConfig
  viteConfigFile?: string
}

export interface TestEnvironmentContext {
  testPath: string
  pragma: Record<string, any>
}

export abstract class TestEnvironmentBase {
  config: PeekyConfig
  context: TestEnvironmentContext

  constructor (config: PeekyConfig, context: TestEnvironmentContext) {
    this.config = config
    this.context = context
  }

  abstract create (): Awaitable<void>

  abstract destroy (): Awaitable<void>
}

export type InstantiableTestEnvironmentClass = {
  new(...args: ConstructorParameters<typeof TestEnvironmentBase>): TestEnvironmentBase
}

declare module 'vite' {
  interface UserConfig {
    /**
     * Peeky configuration
     */
    test?: PeekyConfig
  }
}
