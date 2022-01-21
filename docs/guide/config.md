# Configuration

To configure Peeky, create a `peeky.config.mjs` or `peeky.config.ts` (Typescript) file in the project root (where you run the `peeky` command).

```js
import { defineConfig } from '@peeky/test'

export default defineConfig({
  // Peeky options here...
})
```

:::tip
If you want to use `peeky.config.js`, you need to use the old `require()` and `module.exports =` syntax.

```js
const { defineConfig } = require('@peeky/test')

module.exports = defineConfig({
  // Peeky options here...
})
```

:::

If you are in a Vite project, you can also put Peeky config in the `test` option in the Vite configuration:

```js
// vite.config.ts

import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    // Peeky options here...
  },
})
```

## Comment Pragma

Some options can be overriden using comment pragma in specific test files.

Example:

```js
/* @peeky {
  runtimeEnv: 'dom',
  mockFs: false
} */
```

- [runtimeEnv](#runtimeenv)
- [mockFs](#mockfs)

## targetDirectory

Allows you to change the working folder for running the tests.

Example:

```js
import path from 'path'

export default defineConfig({
  targetDirectory: path.join(__dirname, './packages/my-app'),
})
```

## match

An array of [anymatch](https://github.com/micromatch/anymatch) search patterns to find the test files.

Default value is:

```js
['**/*.(spec|test).(ts|js|mjs|cjs|jsx|tsx)', '**/__tests__/**/*.(ts|js|mjs|cjs|jsx|tsx)']
```

So by default Peeky will match those files:

```
src/features/foo.spec.js
src/features/foo.test.js
src/features/foo.test.ts
src/features/user/__tests__/foo.js
src/features/user/__tests__/foo.ts
tests/foo.spec.js
```

Example:

```js
export default defineConfig({
  match: ['**/*.spec.ts', '**/__tests__/**/*.ts'],
})
```

## ignored

Array of [anymatch](https://github.com/micromatch/anymatch) patterns to ignore when looking for test files. By default Peeky ignores `node_modules` and `dist` folders.

Example:

```js
export default defineConfig({
  ignored: ['**/node_modules/**'],
})
```

## watchMatch

Array of [anymatch](https://github.com/micromatch/anymatch) patterns of files that will trigger new runs in development mode. By default, Peeky watches all `js` and `ts` files in the project.

Example:

```js
export default defineConfig({
  watchMatch: ['src/**/*.(js|ts|vue)'],
})
```

## watchBaseDirectory

Allow to watch from a different working directory from `targetDirectory`, which can be very useful in a monorepo. Set to `null` to use the `targetDirectory` (default).

Example:

```js
// packages/my-app/peeky.config.js

export default defineConfig({
  // Watch all sibling packages
  watchBaseDirectory: path.resolve(__dirname, '..'),
})
```

## watchIgnored

Array of [anymatch](https://github.com/micromatch/anymatch) patterns to ignore when watching for changes. By default Peeky ignores `node_modules` folders.

Example:

```js
export default defineConfig({
  watchIgnored: ['**/node_modules/**'],
})
```

## watchThrottle

Prevent from running the tests too often in development mode when many files are being changed in a short amount of time. Unit is milliseconds. Default value is 100ms.

Example:

```js
export default defineConfig({
  watchThrottle: 1000, // 1000ms = 1s
})
```

## maxWorkers

Maximum number of concurrent workers (in parallel processes). The default is the number of CPU in your device minus one.

Example:

```js
export default defineConfig({
  maxWorkers: 4,
})
```

## emptySuiteError

Enabling this option will make the test run fail whenever a test suite is empty (it doesn't contain tests). By default this is `false`, so Peeky just skips empty test suites.

Example:

```js
export default defineConfig({
  emptySuiteError: true,
})
```

## collectCoverageMatch

An array of [anymatch](https://github.com/micromatch/anymatch) search patterns to find the files from which coverage will be collected.

Default value is:

```js
['(src|lib)/**/*.(ts|js)']
```

Example:

```js
export default defineConfig({
  collectCoverageMatch: ['lib/**/*.js'],
})
```

## runtimeEnv

Set the runtime environment for all tests. [More info here](./runtime-env.md).

Default is `'node'`.

Example:

```js
export default defineConfig({
  runtimeEnv: 'dom',
})
```

You can use comment pragma in a specific test to override the global configuration:

```js
/* @peeky {
  runtimeEnv: 'dom'
} */

describe('DOM', () => {
  test('create a div', () => {
    // Dumb example test
    const el = document.createElement('div')
    el.innerText = 'hello'
    document.body.appendChild(el)
    expect(el.innerHTML).toBe('<div>hello</div>')

    // Test your Vue, React, etc. components here
  })
})
```

## runtimeAvailableEnvs

Exposes custom runtime environments to be used with comment pragma in tests. [More info here](./runtime-env.md).

Default is `{}`.

Example:

```js
import { defineConfig, TestEnvironmentBase } from '@peeky/test'

class MyEnv extends TestEnvironmentBase {
  constructor (config, context) {
    super(config, context)
  }

  create () {
    // do something
  }

  destroy () {
    // do something
  }
}

export default defineConfig({
  runtimeAvailableEnvs: {
    'my-env': MyEnv,
  },
})
```

Then in a test:

```js
/* @peeky {
  runtimeEnv: 'my-env'
} */

describe('Using my custom env', () => {
  // ...
})
```

## mockFs

Enable or disable mocking the file system to prevent writing files to the real disk when executing tests. The mocked filesystem will read existing files from disk and write changes to memory instead of the physical disk.

Default is `true`.

Example:

```js
export default defineConfig({
  mockFs: false,
})
```

You can use comment pragma in a specific test to override the global configuration:

```js
/* @peeky {
  mockFs: true
} */

import fs from 'fs'
import path from 'path'

describe('file system', () => {
  test('write a file', () => {
    const file = path.resolve(__dirname, './test.txt')
    // This file WILL NOT be written to disk
    fs.writeFileSync(file, 'Hello World', 'utf8')
    const contents = fs.readFileSync(file, 'utf8')
    expect(contents).toBe('Hello World')
  })
})
```

```js
/* @peeky {
  mockFs: false
} */

import fs from 'fs'
import path from 'path'

describe('file system', () => {
  test('write a file', () => {
    const file = path.resolve(__dirname, './test.txt')
    // This file WILL be written to disk
    fs.writeFileSync(file, 'Hello World', 'utf8')
    const contents = fs.readFileSync(file, 'utf8')
    expect(contents).toBe('Hello World')
  })
})
```
## buildExclude

An array of RegExp, module names or functions of the form `(absolutePath: string) => boolean` that should not be processed during building. This can improve performance.

Default value is `[/node_modules/]`.

Example:

```js
export default defineConfig({
  buildExclude: [
    /node_modules/,
    // Or:
    (absolutePath) => absolutePath.includes('/node_modules/'),
  ],
})
```

## buildInclude

An array of RegExp, module names or functions of the form `(absolutePath: string) => boolean` that should be processed during building. This is useful if some packages you use are using ESM format but are not correctly set up to tell Node.js to use ESM. This takes precedence over `buildExclude`.

Default value is `[/node_modules\/(vue|@vue|diff)/]`. It will be merged with your configuration.

Example:

```js
export default defineConfig({
  buildInclude: [
    /node_modules\/vue/,
    // Or:
    (absolutePath) => absolutePath.includes('/node_modules/vue'),
  ],
})
```

## vite

Vite [config object](https://vitejs.dev/config/).

Example:

```js
export default defineConfig({
  vite: {
    // vite options here...
  },
})
```

## reporters

Array of reporters. Available values:
- `'console-fancy'`
- `'console-json'`

Example:

```js
export default defineConfig({
  reporters: [
    'console-json',
  ],
})
```

## setupFiles

Array of paths to files that will be executed before running each test file.

Example:

```js
export default defineConfig({
  setupFiles: [
    './test/setup.ts',
  ],
})
```

## isolate

Isolate the environment in the threaded workers for each test. Can impact performance.

Default is `false`.

Example:

```js
export default defineConfig({
  isolate: true,
})
```
