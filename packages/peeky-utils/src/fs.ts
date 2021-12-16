export function slash (path: string) {
  return path.replace(/\\/g, '/')
}

export function fixWindowsAbsoluteFileUrl (path: string) {
  if (path.match(/^\w:\\/)) {
    return `file:///${slash(path)}`
  } else {
    return path
  }
}
