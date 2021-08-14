# Writing tests

## Test suites

Inside a test file, tests are grouped together inside Test suites. They are created with the `describe` method:

```js
describe('myFunc()', () => {
  test('typical usage', () => {
    // test code with assertions...
  })

  test('error case', () => {
    // test code with assertions...
  })
})
```

### Suite hooks

You can execute some code at some specific point in your test suite with the following hooks:

- `beforeAll`: called before the first test is run in the suite.
- `afterAll`: called after all tests are completed in the suite.
- `beforeEach`: called before each test in the suite.
- `afterEach`: called after each test in the suite.

Example:

```js
import { createReactiveFileSystem } from '@peeky/reactive-fs'

let fs

describe('reactive fs: list()', () => {
  beforeEach(async () => {
    fs = await createReactiveFileSystem({ /* ... */ })
  })

  afterEach(() => {
    fs.destroy()
  })

  test('scan for files', () => {
    expect(fs.list().sort()).toEqual(['sub/waf.js', 'meow.js'].sort())
  })

  test('exclude sub directories', () => {
    expect(fs.list('.', { excludeSubDirectories: true }).sort()).toEqual(['meow.js'].sort())
  })

  // more tests...
})
```

## Assertions

Peeky uses `expect` from Jest to check for assertions in your tests.

Look at some examples below:

```js
test('check assertions with expect', () => {
  expect(42).toBe(42)
  expect(21).not.toBe(42)
  expect([1, 2, 3]).toEqual([1, 2, 3])
  expect(undefined).toBeUndefined()
  expect(null).toBeNull()
  expect(1).toBeTruthy()
})
```

For the complete list of available assertions, see [expect docs](https://jestjs.io/docs/expect).

## Mocking

If you need mocks/stubs/spies in your tests, Peeky includes Sinon out-of-the-box.

```js
test('use a sinon mock', () => {
  const spy = sinon.fake()
  spy()
  expect(spy.callCount).toBe(1)
})
```

Learn more at the [sinon docs](https://sinonjs.org/#fakes).

## Module mocking

::: warning
This API is experimental and may change in the future.
:::

Sometimes it's useful to replace the existing implementation of a module used in the file you are testing. You can use `peeky.mockModule` to stub a module - it will replace the real module with the fake implementation you provide.

Example:

```js
// bar.ts

import { foo } from './foo'

export function bar (meow) {
  return foo(meow)
}
```

```js
// bar.spec.ts

describe('mock module', () => {
  test('mock a module during the test', async () => {
    peeky.mockModule('./foo.js', {
      foo (count) {
        return count + 1
      },
    })
    import('./foo')

    const { bar } = await import('./bar')

    expect(bar(42)).toBe(43)
  })
})
```

::: tip
Even if you uses Typescript files, mock the module with the `js` version: use `peeky.mockModule('./foo.js')` instead of `peeky.mockModule('./foo')` or `peeky.mockModule('./foo.ts')`.
:::

## Retry

::: warning
This API is experimental and may change in the future.
:::

With `peeky.retry()`, you can enclose code in a fail-safe so it will retry automatically if an error is thrown inside.

Example:

```js
describe('peeky.retry()', () => {
  test('must not retry when no error', async () => {
    const spy = sinon.fake()
    expect(spy.callCount).toBe(0)
    await peeky.retry(() => spy(), 10)
    expect(spy.callCount).toBe(1)
  })

  test('retry multiple times', async () => {
    let times = 0
    const spy = sinon.fake(() => {
      times++
      if (times < 4) {
        throw new Error('Not enough times')
      }
    })
    expect(spy.callCount).toBe(0)
    await peeky.retry(() => spy(), 5)
    expect(spy.callCount).toBe(4)
  })

  test('retry multiple times and bail out', async () => {
    const spy = sinon.fake(() => {
      throw new Error('Not enough times')
    })
    expect(spy.callCount).toBe(0)
    let error: Error
    try {
      await peeky.retry(() => spy(), 5)
    } catch (e) {
      error = e
    }
    expect(spy.callCount).toBe(5)
    expect(error).not.toBeUndefined()
  })
})
```
