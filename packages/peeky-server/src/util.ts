export function getSrcFile (path) {
  return path.replace('dist', 'src').replace('js', 'ts')
}
