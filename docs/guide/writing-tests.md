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
