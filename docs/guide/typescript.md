# Typescript

Peeky will automatically handle the Typescript files in your project. You can for example create a test file called `foo.spec.ts` and import other TypeScript files inside.

If you're using Typescript and would like to get the right typings for global test methods, make sure to add `@peeky/runner` to the types array in `tsconfig.json`.

```json
/* tsconfig.json */
{
  "compilerOptions": {
    "types": ["@peeky/runner"],
    "esModuleInterop": true // Necessary for 'expect' typing to work
  }
}
```

Note that we need to enable the `esModuleInterop` option because `expect` is using the `export = expectObject` syntax.

You can then use all the global properties provided by Peeky such as `describe`, `it`, `test`, `expect`, etc. without importing them to have their typings:

```ts
// Your IDE should autocomplete those
describe('typescript test suite', () => {
  it('meows', () => {
    expect('meow').toBe('meow')
  })
})
```

## Separate folder

If you prefer writing your tests in a dedicated folder, also make sure to add it in the `include` array.

```json
/* tsconfig.json */
{
  "compilerOptions": {
    "types": ["@peeky/runner"],
    "esModuleInterop": true // Necessary for 'expect' typing to work
  },
  "include": ["tests/**/*.spec.ts"]
}
```

You can also create another `tsconfig.json` file in the tests folder. Let's say you want to put all your tests in a `tests` folder, you can create this config file inside:

```json
/* tests/tsconfig.json */
{
  "compilerOptions": {
    "lib": [
      "ESNext"
    ],
    "types": [
      "node",
      "@peeky/runner"
    ],
    "esModuleInterop": true
  }
}
```
