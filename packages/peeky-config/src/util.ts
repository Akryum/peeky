import { isObject } from '@peeky/utils'

export function mergeConfig (
  a: Record<string, any>,
  b: Record<string, any>,
): Record<string, any> {
  const merged: Record<string, any> = { ...a }
  for (const key in b) {
    const value = b[key]
    if (value == null) {
      continue
    }

    const existing = merged[key]
    if (Array.isArray(existing) && Array.isArray(value)) {
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
