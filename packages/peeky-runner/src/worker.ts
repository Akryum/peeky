import { worker } from '@akryum/workerpool'
import { runTestFile } from './runner'

worker({
  runTestFile,
})
