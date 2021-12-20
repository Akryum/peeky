import { answer } from './js-module'
import { foo } from './demo-lodash-es'

describe('Import JS module from TS test', () => {
  test('works', () => {
    expect(answer).toBe(42)
  })

  test('lodash-es', () => {
    expect(foo()).toBe('foo')
  })
})
