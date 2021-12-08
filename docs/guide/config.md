# Configuration

To configure Peeky, create a `peeky.config.mjs` or `peeky.config.ts` (Typescript) file in the project root (where you run the `peeky` command).

```js
import { defineConfig } from '@peeky/cli'

export default defineConfig({
  // Peeky options here...
})
```

:::tip
If you want to use `peeky.config.js`, you need to use the old `require()` and `module.exports =` syntax.

```js
const { defineConfig } = require('@peeky/cli')

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

## buildExclude

An array of RegExp, file glob or function of the form `(absolutePath: string) => boolean` that should not be processed during building. This can improve performance.

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

An array of RegExp, file glob or function of the form `(absolutePath: string) => boolean` that should be processed during building. This is useful if some packages you use are using ESM format but are not correctly set up to tell Node.js to use ESM. This takes precedence over `buildExclude`.

Default value is `[/node_modules\/(vue|@vue|diff)/]`.

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
