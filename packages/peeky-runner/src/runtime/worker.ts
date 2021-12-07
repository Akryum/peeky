import { worker } from '@akryum/workerpool'
import { runTestFile } from './run-test-file.js'

worker({
  runTestFile,
})
