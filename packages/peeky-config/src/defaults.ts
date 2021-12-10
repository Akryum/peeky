import type { PeekyConfig } from './types'

export const peekyConfigFileMatch = ['**/peeky.config.(js|ts)']

export const defaultPeekyConfig: () => PeekyConfig = () => ({
  targetDirectory: process.cwd(),
  match: ['**/*.(spec|test).(ts|js|mjs|cjs|jsx|tsx)', '**/__tests__/**/*.(ts|js|mjs|cjs|jsx|tsx)'],
  ignored: ['**/node_modules/**', '**/dist/**'],
  watchMatch: ['**/*.(js|ts)'],
  watchBaseDirectory: null,
  watchIgnored: ['**/node_modules/**'],
  watchThrottle: 100,
  emptySuiteError: false,
  collectCoverageMatch: ['(src|lib)/**/*.(ts|js)'],
  buildExclude: [/node_modules/],
  buildInclude: [
    'vitest/dist',
    'vitest/src',
    (file) => file.includes('@vue') && !file.endsWith('@vue/test-utils/dist/vue-test-utils.js'),
    '@vueuse',
    'vue-demi',
    'vue',
    /virtual:/,
    /\.ts$/,
    /\/esm\/.*\.js$/,
    /\.(es|esm|esm-browser|esm-bundler|es6).js$/,
  ],
  runtimeEnv: 'node',
  mockFs: true,
})
