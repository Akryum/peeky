import fs from 'fs'
import { fs as memfs } from 'memfs'
import { ufs } from 'unionfs'
import { patchFs, patchRequire } from 'fs-monkey'
import { dirname } from 'path'

export { fs as memfs } from 'memfs'
export { ufs as fs } from 'unionfs'

export const realFs = { ...fs }
let mockedFs = false

export function mockFileSystem () {
  if (mockedFs) return
  mockedFs = true
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  ufs.use(realFs).use(memfs)
  // Patch unionfs to write to memfs only
  Object.assign(ufs, {
    unwatchFile: realFs.unwatchFile,
    mkdir: memfs.mkdir,
    mkdirSync: memfs.mkdirSync,
    write: memfs.write,
    writeFile: (path, ...args) => {
      memfs.mkdirpSync(dirname(path))
      // @ts-ignore
      return memfs.writeFile(path, ...args)
    },
    writeFileSync: (path, ...args) => {
      memfs.mkdirpSync(dirname(path))
      // @ts-ignore
      return memfs.writeFileSync(path, ...args)
    },
  })
  patchFs(ufs)
  patchRequire(ufs)
}
