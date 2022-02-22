import { basename } from 'pathe'
import consola from 'consola'
import { RunTestFileData } from './schema/index.js'

export function getSrcFile (path: string) {
  return path.replace('dist', 'src').replace('js', 'ts')
}

export function getErrorPosition (filePath: string, stack: string) {
  const result = new RegExp(`${filePath}:(\\d+):(\\d+)`).exec(stack.replace(/\\/g, '/'))
  if (result) {
    const [_, line, col] = result
    return {
      line: parseInt(line),
      col: parseInt(col),
    }
  } else {
    consola.warn(`Couldn't get position from error: ${stack}`)
    return {
      line: 1,
      col: 1,
    }
  }
}

export function formatRunTestFileErrorMessage (e: Error, runTestFile: RunTestFileData) {
  let { message } = e
  message = message.replace(/__output.js/, basename(runTestFile.testFile.relativePath))
  return message
}
