import type { C8Options, PeekyConfig } from './types'

const defaultCoverageExcludes = [
  'coverage/**',
  'packages/*/test{,s}/**',
  '**/*.d.ts',
  'cypress/**',
  'test{,s}/**',
  'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
  '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
  '**/__tests__/**',
  '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc}.config.{js,cjs,mjs,ts}',
  '**/.{eslint,mocha}rc.{js,cjs}',
]

const coverageConfigDefaults: C8Options = {
  reportsDirectory: './coverage',
  excludeNodeModules: true,
  exclude: defaultCoverageExcludes,
  reporter: ['text', 'html'],
  // default extensions used by c8, plus '.vue' and '.svelte'
  // see https://github.com/istanbuljs/schema/blob/master/default-extension.js
  extension: ['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx', '.vue', 'svelte'],
}

export const defaultPeekyConfig: () => PeekyConfig = () => ({
  targetDirectory: process.cwd(),
  match: [
    '**/*.(spec|test).(ts|js|mjs|cjs|jsx|tsx)',
    '**/__tests__/**/*.(ts|js|mjs|cjs|jsx|tsx)',
  ],
  ignored: [
    '**/node_modules/**',
    '**/dist/**',
  ],
  watchMatch: [
    '**/*.(js|ts)?(x)',
    '**/*.(json|xml|vue|svelte)',
  ],
  watchBaseDirectory: null,
  watchIgnored: ['**/node_modules/**'],
  watchThrottle: 100,
  emptySuiteError: false,
  collectCoverage: false,
  coverageOptions: coverageConfigDefaults,
  buildExclude: [
    /\.cjs.js$/,
    /\.mjs$/,
  ],
  buildInclude: [
    /virtual:/,
    /\.ts$/,
    /\/esm\/.*\.js$/,
    /\.(es|esm|esm-browser|esm-bundler|es6).js$/,
  ],
  runtimeEnv: 'node',
  mockFs: true,
})
