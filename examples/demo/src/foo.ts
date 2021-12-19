export function foo (count) {
  return count + 42
}

export function doesntWork () {
  const obj = {} as any
  return obj.foo.bar
}
