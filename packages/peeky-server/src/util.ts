export function getSrcFile (path: string) {
  return path.replace('dist', 'src').replace('js', 'ts')
}

export function getErrorPosition (filePath: string, stack: string) {
  const [result, line, col] = new RegExp(`${filePath}:(\\d+):(\\d+)`).exec(stack)
  return {
    line: parseInt(line),
    col: parseInt(col),
  }
}
