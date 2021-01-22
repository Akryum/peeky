import { defineConfig } from '@peeky/config'
import { join } from 'path'

export default defineConfig({
  targetDirectory: join(__dirname, 'specs'),
})
