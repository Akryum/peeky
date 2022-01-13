# Contributing

Thank you for your interest in contributing to Peeky! :cat2: Please read this guide to help you get started.

## Local setup

Before contributing code, you need to setup Peeky locally on your computer.

1. Clone this repo
2. Peeky uses [pnpm](https://pnpm.io/) as package mananger, so make sure you have it installed
3. Install dependencies with `pnpm i`

It's recommended to use Node 16+.

There is playground folder to test your changes in the [./examples/demo](./examples/demo) folder.

### Watch mode

This script will build and watch all the peeky packages:

```
pnpm run watch
```

### Build

This script will build all peeky packages:

```
pnpm run build
```

## Tests & Linting

Before creating a pull request, make sure everything checks!

```
pnpm run lint
pnpm run test
```

Peeky uses Peeky for unit tests! You can create tests by adding `*.spec.ts` files in the source code.

## Docs

The Peeky documentation uses [Vitepress](https://github.com/vuejs/vitepress/). You can run the docs site locally with this script:

```
pnpm run docs:dev
```

You can edit docs files in the [./docs](./docs) folder.

## Packages

This repo is a monorepo with multiple packages located in the [./packages](./packages) folder.

|Package|Description|Folder|
|--|--|--|
|`@peeky/cli`|Terminal Commands|[packages/peeky-cli](./packages/peeky-cli)|
|`@peeky/client-dist`|Built client files served by the server|[packages/peeky-client-dist](./packages/peeky-client-dist)|
|`@peeky/client`|Client Vue 3 app (source)|[packages/peeky-client](./packages/peeky-client)|
|`@peeky/config`|Config types & utils|[packages/peeky-config](./packages/peeky-config)|
|`@peeky/eslint-plugin`|ESLint plugin to lint test files|[packages/peeky-eslint-plugin](./packages/peeky-eslint-plugin)|
|`@peeky/runner`|Core test runner (includes Vite)|[packages/peeky-runner](./packages/peeky-runner)|
|`@peeky/server`|GraphQL API server|[packages/peeky-server](./packages/peeky-server)|
|`@peeky/test`|Main package to install by the user|[packages/peeky-test](./packages/peeky-test)|
|`@peeky/utils`|Common utils|[packages/peeky-utils](./packages/peeky-utils)|
