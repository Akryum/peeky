import { isObject } from '@peeky/utils'
import { PeekyConfig, ProgramPeekyConfig, SerializablePeekyConfig } from './types.js'

const mergedArrays: string[] = [
  'buildInclude',
]

export function mergeConfig<T extends (Record<string, any>) = Record<string, any>> (a: T, b: T): T {
  const merged: T = { ...a }
  for (const key in b) {
    const value = b[key]
    if (value == null) {
      continue
    }

    const existing = merged[key]
    if (Array.isArray(existing) && Array.isArray(value) && mergedArrays.includes(key)) {
      // @ts-ignore
      merged[key] = [...existing, ...value]
      continue
    }
    if (isObject(existing) && isObject(value)) {
      merged[key] = mergeConfig(existing, value)
      continue
    }

    merged[key] = value
  }
  return merged
}

export function toSerializableConfig (config: PeekyConfig): SerializablePeekyConfig {
  const result = toProgramConfig(config)
  delete result.vite
  return result as SerializablePeekyConfig
}

export function toProgramConfig (config: PeekyConfig): ProgramPeekyConfig {
  const result = { ...config }
  if (typeof result.runtimeEnv !== 'string') {
    delete result.runtimeEnv
  }
  delete result.runtimeAvailableEnvs
  delete result.buildInclude
  delete result.buildExclude
  return result as ProgramPeekyConfig
}
