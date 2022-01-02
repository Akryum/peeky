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

You can however put tests outside of a `describe` function: they will be added to an anonymous test suite automatically:

```js
test('some test without describe', () => {
  // ...
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
import { createReactiveFileSystem } from 'reactive-fs'

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

## Flags

Using test flags, you can control how your tests are run.

### Only

Tests with this flag will be the only ones run in the current test suite.

```js
test.only('should work', () => {
  expect(1).toBe(1)
})
```

### Skip

The tests with this flag will not be run.

```js
test.skip('should work', () => {
  expect(1).toBe(1)
})
```

### Todo

The tests with this flag will not be run. The handler function is optional - useful to add tests that you want to write later.

```js
test.todo('test my function')
```

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

peeky.mockModule('./foo.ts', {
  foo (count) {
    return count + 1
  },
})

// Should be imported after relevant modules are mocked
// Example comment to disable the ESLint rule:
/* eslint-disable-next-line import/first */
import { bar } from './bar'

describe('mock module', () => {
  test('mock a module during the test', () => {
    expect(bar(42)).toBe(43)
  })
})
```

You can also use dynamic import:

```js
// bar.spec.ts

peeky.mockModule('./foo.ts', {
  foo (count) {
    return count + 1
  },
})

describe('mock module', () => {
  test('mock a module during the test', async () => {
    const { bar } = await import('./bar')
    expect(bar(42)).toBe(43)
  })
})
```

::: tip
Please include the file extension when mocking a module so it can be resolved correctly.
:::

## Text Snapshots

The `toMatchSnapshot` assertion allows you to store text that will be compared in future runs of the test. It is very useful to detect regressions.

Example:

```js
/* @peeky {
  runtimeEnv: 'dom'
} */

// Include template compiler
import { createApp } from 'vue/dist/vue.esm-bundler'

describe('vue', () => {
  test('create vue app', () => {
    const app = createApp({
      data () {
        return {
          msg: 'hello',
        }
      },
      template: '<div>{{ msg }}</div>',
    })
    expect(document.body.innerHTML).toMatchSnapshot()
  })
})
```

The first time, it will create a `__snapshots__` folder with a `vue.spec.js.snap` file that stores the expected value. Next time the test is run, Peeky will load and compare the stored snapshot with the new value.

::: tip
You should commit the content of the `__snapshots__` folder so snapshots are correctly stored for future runs.
:::

By default Peeky will use the suite and test titles to generate the snapshot name. You can specify a hint to help distinguish the snapshot names in case you have multiple ones in a single test:

```js
test('many snapshots', () => {
  expect('Meow!').toMatchSnapshot('cat')
  expect('Waf!').toMatchSnapshot('dog')
})
```

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
