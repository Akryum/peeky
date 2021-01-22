import { isObject } from '@peeky/utils'

export function mergeConfig<T extends (Record<string, any>) = Record<string, any>> (a: T, b: T): T {
  const merged: T = { ...a }
  for (const key in b) {
    const value = b[key]
    if (value == null) {
      continue
    }

    const existing = merged[key]
    if (Array.isArray(existing) && Array.isArray(value)) {
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
