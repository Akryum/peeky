# Configuration

To configure Peeky, create a `peeky.config.js` or `peeky.config.ts` (Typescript) file in the project root (where you run the `peeky` command).

```js
import { defineConfig } from '@peeky/cli'

export default defineConfig({
  // Peeky options here...
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
['**/*.(spec|test).(ts|js)', '**/__tests__/**/*.(ts|js)']
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

Array of [anymatch](https://github.com/micromatch/anymatch) patterns to ignore when looking for test files. By default Peeky ignores `node_modules`.

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
