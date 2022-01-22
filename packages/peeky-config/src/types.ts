import type { InlineConfig as ViteConfig } from 'vite'
import { Awaitable } from '@peeky/utils'

export type ModuleFilter = string | RegExp | ((absolutePath: string) => boolean)
export type ModuleFilterOption<T = ModuleFilter> = T[] | T
export type SerializableModuleFilter = string | RegExp

export type SerializableRuntimeEnv = 'node' | 'dom'
export type BuiltinReporter = 'console-fancy' | 'console-json'

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
  collectCoverage?: boolean
  collectCoverageMatch?: string | string[]
  runtimeEnv?: SerializableRuntimeEnv | typeof TestEnvironmentBase
  runtimeAvailableEnvs?: Record<string, typeof TestEnvironmentBase>
  mockFs?: boolean
  buildExclude?: ModuleFilterOption
  buildInclude?: ModuleFilterOption
  vite?: ViteConfig
  viteConfigFile?: string
  reporters?: BuiltinReporter[]
  setupFiles?: string[]
  isolate?: boolean
}

export type SerializablePeekyConfig = Omit<PeekyConfig, 'runtimeEnv' | 'runtimeAvailableEnvs' | 'buildExclude' | 'buildInclude' | 'vite'> & {
  runtimeEnv?: SerializableRuntimeEnv
  buildExclude?: ModuleFilterOption<SerializableModuleFilter>
  buildInclude?: ModuleFilterOption<SerializableModuleFilter>
}

export type ProgramPeekyConfig = SerializablePeekyConfig & {
  vite?: PeekyConfig['vite']
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
    test?: SerializablePeekyConfig
  }
}
