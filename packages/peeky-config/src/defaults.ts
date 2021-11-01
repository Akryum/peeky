import { PeekyConfig } from './types'

export const peekyConfigFileMatch = ['**/peeky.config.(js|ts)']

export const defaultPeekyConfig: () => PeekyConfig = () => ({
  targetDirectory: process.cwd(),
  match: ['**/*.(spec|test).(ts|js)', '**/__tests__/**/*.(ts|js)'],
  ignored: ['**/node_modules/**'],
  watchMatch: ['**/*.(js|ts)'],
  watchBaseDirectory: null,
  watchIgnored: ['**/node_modules/**'],
  watchThrottle: 100,
  emptySuiteError: false,
  collectCoverageMatch: ['(src|lib)/**/*.(ts|js)'],
  external: [
    /node_modules/,
  ],
})
