import { initWorkerMessaging } from './message.js'
import { runTestFile } from './run-test-file.js'

export default (payload) => {
  initWorkerMessaging(payload.port)
  delete payload.port

  return runTestFile(payload)
}
