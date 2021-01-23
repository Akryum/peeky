import { defineConfig } from '@peeky/config'
import { join, resolve } from 'path'

export default defineConfig({
  targetDirectory: join(__dirname, 'specs'),
  watchBaseDirectory: resolve(__dirname, '..'),
})
