import { worker } from '@akryum/workerpool'
import { runTestFile } from './run-test-file'

worker({
  runTestFile,
})
