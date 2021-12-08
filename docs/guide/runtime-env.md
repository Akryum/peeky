# Runtime environments

By default, Peeky use the native Node.js environment to run your tests. You can however chose another environment, for example to test Web components in a browser-like environment.

## Global config

In your [Peeky config](./config.md), you can specify the environment to use with the `runtimeEnv` option:

```js
import { defineConfig } from '@peeky/test'

export default defineConfig({
  runtimeEnv: 'dom', // Default is 'node'
})
```

This will ensure that all your tests are using a browser-like environment.

## Specific to a test

In a test file, you can use comments pragma to specify the runtime environment to use:

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

## Built-in environments

The following environments are available by default:

- `node` (default): native Node.js environment
- `dom`: browser-like environment with a simulated DOM interface

## Custom environment

You can create a custom runtime environment by extending the `TestEnvironmentBase` abstract class and putting it in the `runtimeEnv` option:

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
  runtimeEnv: MyEnv,
})
```

It should implement the `create()` and `destroy()` methods which will be called automatically by Peeky.

### Use in a specific test

If you don't want to use your custom environment for all your tests, you can use the `runtimeAvailableEnvs` option to specify which environments are available for your tests:

```js
export default defineConfig({
  runtimeAvailableEnvs: {
    'my-env': MyEnv,
  },
})
```

Then in a test you can use the comment pragma to use it:


```js
/* @peeky {
  runtimeEnv: 'my-env'
} */

describe('Using my custom env', () => {
  // ...
})
```
