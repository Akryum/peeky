import { worker } from '@akryum/workerpool'
import { setupWorker } from './setup.js'
import { runTestFile } from './run-test-file.js'

worker({
  setupWorker,
  runTestFile,
})
