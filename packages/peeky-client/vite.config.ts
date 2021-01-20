import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: [
      /@apollo/,
      /@vue\/apollo/,
      /graphql/,
    ],
    include: [
      'fast-json-stable-stringify',
      'zen-observable',
      'graphql-tag',
      'subscriptions-transport-ws',
    ],
  },
  alias: {
    tslib: 'tslib/tslib.es6.js',
  },
})
