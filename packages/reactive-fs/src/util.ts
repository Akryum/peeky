export function areDifferent (a, b) {
  if (Array.isArray(a) && Array.isArray(b) && a !== b) {
    return a.length !== b.length || a.some((v, index) => b[index] !== v)
  } else if (isObject(a) && isObject(b) && a !== b) {
    for (const key in a) {
      if (a[key] !== b[key]) return true
    }
    return false
  }
  return a !== b
}

export function isObject (value: unknown): value is Record<string, any> {
  return Object.prototype.toString.call(value) === '[object Object]'
}
