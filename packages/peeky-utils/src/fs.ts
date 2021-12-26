import { isAbsolute } from 'path'
import { pathToFileURL } from 'url'

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
