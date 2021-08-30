module.exports = {
  configs: {
    recommended: {
      plugins: ['@peeky'],
      env: { '@peeky/globals': true },
    },
  },
  environments: {
    globals: {
      /** @see packages/peeky-runner/src/globals.ts */
      globals: {
        peeky: false,
        expect: false,
        sinon: false,
        describe: false,
        it: false,
        test: false,
        beforeAll: false,
        afterAll: false,
        beforeEach: false,
        afterEach: false,
      },
    },
  },
}
