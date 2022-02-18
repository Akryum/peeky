import { defineConfig } from '@peeky/test'

// class MyEnv extends TestEnvironmentBase {
//   create () {
//     // do nothing
//   }

//   destroy () {
//     // do nothing
//   }
// }

export default defineConfig({
  // match: ['**/bar.spec.ts'],
  // external: [],
  // runtimeEnv: MyEnv,
  // mockFs: false,
  // reporters: ['console-json'],
  setupFiles: [
    'setup-test.ts',
  ],
  // collectCoverage: true,
})
