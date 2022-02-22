# Getting started

Welcome! In this guide, you'll learn how to get around Peeky. [Learn more about Peeky here](./introduction.md).

## Installation

Install the Peeky into your project:

```shell
npm i -D @peeky/test
# OR
yarn add -D @peeky/test
```

Add scripts to use the CLI in your `package.json` file:

```json{6-7}
{
  "name": "peeky-demo",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "test:open": "peeky open",
    "test": "peeky run"
  },
  "devDependencies": {
    "@peeky/test": "^0.13.2"
  }
}
```

## Our first test

Create a test file and give it the extension `.spec.js`:

```js
// src/example.spec.js

describe('Example test suite', () => {
  test('must work', () => {
    expect(42).toBe(42)
  })
})
```

Find all the available assertions [here](https://jestjs.io/docs/expect).

## Development UI

Run the `test:open` script:

```shell
npm run test:open
# OR
yarn test:open
```

Peeky will open in your default browser and you can see the result of your test in real-time:

<img src="/get-started-example.png" alt="Test run seen in the UI example" class="rounded shadow-lg border border-solid border-gray-100">

By default, the Peeky UI will watch for changes. Editing your files will automatically run the relevant tests again.

Let's try adding a failing test to our suite:

```js{8-10}
// src/example.spec.js

describe('Example test suite', () => {
  test('must work', () => {
    expect(42).toBe(42)
  })

  test('oops', () => {
    expect('hey').toBe('hello')
  })
})
```

If you go back to Peeky, you will notice that your tests were run again. As expected, the new test is failing with an assertion error:

<img src="/get-started-error.png" alt="Test failing seen in the UI" class="rounded shadow-lg border border-solid border-gray-100">

Clicking the filename in the error popin will politely ask Peeky to open the corresponding test file in your favorite code editor.

::: tip 💡️ Tip
By default, Peeky will try to find the [supported editor](https://github.com/yyx990803/launch-editor#supported-editors) that are currently running on your device. In the case that doesn't work, you can add the `EDITOR` environment variable to your system, using the path to your favorite code editor binary as the value.
:::

Let's fix the failing test:

```js{8-10}
// src/example.spec.js

describe('Example test suite', () => {
  test('must work', () => {
    expect(42).toBe(42)
  })

  test('yay', () => {
    expect('hello').toBe('hello')
  })
})
```

Back to Peeky, the error is now gone and all tests are passing again:

<img src="/get-started-fixed.png" alt="Test fixed seen in the UI" class="rounded shadow-lg border border-solid border-gray-100">

## Terminal only

To run all the tests without the UI, you can run the `test` script:

```shell
npm run test
# OR
yarn test
```

You can see the results in the terminal:

<img src="/get-started-run-cli.png" alt="Result seen in the terminal" class="rounded shadow-lg border border-solid border-gray-100">

Meow*! 🐈️


<p class="text-xs text-gray-500 mt-12">*: Peeky is happy!</p>

## Component testing

Peeky uses [Vite](https://vitejs.dev/) to transform your files automatically. If you are testing components in a Vite project, they should be already transformed correctly. Otherwise, you can use the `vite` option in the [Peeky config](./config.md) to configure Vite depending on your needs.

By default, Peeky use the native Node.js environment to run your tests. You can switch to a browser-like environment (simulating the DOM) to be able to test your web components: see [Runtime environments](./runtime-env.md).
