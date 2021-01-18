import { runTestFile } from '@peeky/runner/dist/child'
import { join } from 'path'

try {
  runTestFile({
    entry: join(__dirname, 'foo.spec.ts'),
  })
} catch (e) {
  process.exit(1)
}
