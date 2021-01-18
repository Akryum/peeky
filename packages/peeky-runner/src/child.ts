import { worker } from 'workerpool'
import { runTestFile } from './runner'

worker({
  runTestFile,
})
