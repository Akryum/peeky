import { isAbsolute } from 'pathe'
import { pathToFileURL } from 'url'

// FIXME: We should probably use either `path.posix.normalize` or vite's `normalize`
export function slash (path: string) {
  return path.replace(/\\/g, '/')
}

export function fixWindowsAbsoluteFileUrl (path: string) {
  if (isAbsolute(path)) {
    return pathToFileURL(path).href
  } else {
    return path
  }
}
