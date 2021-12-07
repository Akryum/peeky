
peeky.mockModule('./foo.ts', {
  foo (count) {
    return count + 1
  },
})

/* eslint-disable-next-line import/first */
import { bar } from './bar'

describe('mock module', () => {
  test('mock a module during the test', async () => {
    // const { bar } = await import('./bar')
    expect(bar(42)).toBe(43)
  })
})
