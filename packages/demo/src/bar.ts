import { foo } from './foo'

export function amNotTested () {
  return 42
}

// Only tested function
export function bar (meow) {
  return foo(meow)
}

export function notTested () {
  return 42
}
