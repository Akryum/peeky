# Vite Setup

This guide will walk you through setting up Peeky in your Vite app.

1. Install the `@peeky/test` package:

```bash
npm i -D @peeky/test
yarn add -D @peeky/test
pnpm add -D @peeky/test
```

2. In your `vite.config.js`, we need to configure Peeky to use a DOM environment to expose browser-like APIs. Peeky will use the `test` option in your Vite config ([learn more](../config.md)):

```js{6-10}
import { defineConfig } from 'vite'

export default defineConfig({
  /* ... */

  // Peeky config
  test: {
    // Use the DOM environment for all tests by default
    runtimeEnv: 'dom',
  },
})
```

3. You can now execute `peeky open` to open the UI or `peeky run` to run all tests:

```bash
npx peeky open
npx peeky run

yarn peeky open
yarn peeky run

pnpm exec peeky open
pnpm exec peeky run
```

4. Add some scripts in your `package.json` to make it easier to run tests:

```json{4-7}
{
  "name": "peeky-demo",
  "version": "0.1.0",
  "scripts": {
    "test:open": "peeky open",
    "test": "peeky run"
  }
}
```
