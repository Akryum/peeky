import fs from 'fs'
import { fs as memfs } from 'memfs'
import { IUnionFs, Union } from 'unionfs'
import { dirname } from 'path'
import { patchFs as patch } from 'fs-monkey'

export { fs as memfs } from 'memfs'

export const realFs = { ...fs }

export function createMockedFileSystem () {
  const ufs = new Union()
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
  return ufs
}

export function patchFs (ufs: IUnionFs): () => void {
  // Promises patching (https://github.com/streamich/fs-monkey/issues/202)
  let promisesBackup
  try {
    promisesBackup = fs.promises
    Object.defineProperty(fs, 'promises', {
      get: () => ufs.promises,
    })
  } catch {}

  // Monkey patch
  const unpatch = patch(ufs)

  // Patch <method>.native()
  for (const key in realFs) {
    if (realFs[key]?.native && !fs[key].native) {
      fs[key].native = (...args) => ufs[key](...args)
    }
  }

  return () => {
    unpatch()

    // Restore promises
    if (promisesBackup) {
      Object.defineProperty(fs, 'promises', {
        get: () => promisesBackup,
      })
    }
  }
}
