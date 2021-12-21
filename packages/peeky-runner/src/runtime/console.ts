import { Console } from 'console'
import { Writable } from 'stream'
import { currentSuite, currentTest, currentTestFile } from './global-context.js'
import { toMainThread } from './message.js'

export function setupConsole () {
  function createWritable (type: 'stdout' | 'stderr') {
    return new Writable({
      write: (chunk, enconding, callback) => {
        toMainThread().onLog(currentSuite?.id, currentTest?.id, type, String(chunk), currentTestFile)
        callback()
      },
    })
  }
  const stdout = createWritable('stdout')
  const stderr = createWritable('stderr')

  const console = new Console({
    stdout,
    stderr,
    colorMode: true,
    groupIndentation: 2,
  })

  globalThis.console = console
}
