/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable prefer-spread */

import fs from 'fs'
import { Volume } from 'memfs'
import { dirname } from 'pathe'
import { patchFs as patch } from 'fs-monkey'

export const realFs = { ...fs, promises: { ...fs.promises } }

type ReaddirEntry = string | Buffer | fs.Dirent

let _ufs: typeof fs
let _memfs: InstanceType<typeof Volume>

export function createMockedFileSystem (): any {
  if (_ufs) {
    _memfs.reset()
    return _ufs
  }

  const memfs = new Volume()
  _memfs = memfs

  const allFss: any[] = [realFs, memfs]
  const readFss: any[] = [realFs, memfs]
  const writeFss: any[] = [memfs]

  const ufs = {
    _enabled: false,
  } as any

  // Sync

  for (const [fsList, methods] of [[readFss, fsSyncMethodsRead], [writeFss, fsSyncMethodsWrite]] as any[]) {
    for (const method of methods) {
      if (specialMethods.includes(method)) continue

      ufs[method] = (...args) => {
        if (!ufs._enabled) {
          return realFs[method].apply(realFs, args)
        }

        let error: Error = null
        for (const s of fsList) {
          try {
            error = null
            if (!s[method]) throw new Error(`${method} not found`)
            return s[method].apply(s, args)
          } catch (e) {
            error = e
          }
        }
        if (error) {
          throw error
        }
      }
    }
  }

  // Async

  for (const [fsList, methods] of [[readFss, fsAsyncMethodsRead], [writeFss, fsAsyncMethodsWrite]] as any[]) {
    for (const method of methods) {
      if (specialMethods.includes(method)) continue

      ufs[method] = (...args) => {
        if (!ufs._enabled) {
          return realFs[method].apply(realFs, args)
        }

        let cbArgIndex = args.length - 1
        let cb = args[cbArgIndex]

        if (typeof cb !== 'function') {
          cb = null
          cbArgIndex++
        }

        let error: Error = null

        const iterate = (i: number, err: Error) => {
          if (err) {
            error = err
          }

          if (i >= fsList.length) {
            if (cb) cb(error)
            return
          }

          args[cbArgIndex] = (e, ...a) => {
            if (e) {
              iterate(i + 1, e)
            } else if (cb) {
              cb.call(cb, e, ...a)
            }
          }

          const s = fsList[i]
          const func = s[method]

          if (!func) {
            iterate(i + 1, new Error(`${method} not found`))
          } else {
            func.apply(s, args)
          }
        }
        iterate(0, null)
      }
    }
  }

  // Promises

  ufs.promises = {}

  for (const [fsList, methods] of [[readFss, fsPromiseMethodsRead], [writeFss, fsPromiseMethodsWrite]] as any[]) {
    for (const method of methods) {
      if (specialMethods.includes(method)) continue

      ufs.promises[method] = async (...args) => {
        if (!ufs._enabled) {
          return realFs.promises[method].apply(realFs, args)
        }

        let error: Error = null
        for (const s of fsList) {
          try {
            error = null
            if (!s.promises?.[method]) throw new Error(`promises.${method} not found`)
            const result = await s.promises[method].apply(s, args)
            // Use await to catch errors
            return result
          } catch (e) {
            error = e
          }
        }
        if (error) {
          throw error
        }
      }
    }
  }

  ufs.watch = (...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      return realFs.watch(...args)
    }

    const watchers: fs.FSWatcher[] = []
    for (const s of readFss) {
      try {
        const watcher = s.watch.apply(s, args)
        watchers.push(watcher)
      } catch (e) {}
    }

    // return a proxy to call functions on these props
    return createFSWatcherProxy(watchers)
  }

  ufs.watchFile = (...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      realFs.watchFile(...args)
    }

    for (const s of readFss) {
      try {
        s.watchFile.apply(s, args)
      } catch (e) {}
    }
  }

  ufs.unwatchFile = (...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      realFs.unwatchFile(...args)
    }

    throw new Error('unwatchFile not supported, please use watchFile')
  }

  ufs.existsSync = (path: string) => {
    if (!ufs._enabled) {
      return realFs.existsSync(path)
    }

    for (const s of readFss) {
      try {
        if (s.existsSync(path)) {
          return true
        }
      } catch (e) {}
    }
    return false
  }

  ufs.readdirSync = (...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      return realFs.readdirSync(...args)
    }

    let error: Error = null
    const result = new Map<string, ReaddirEntry>()

    for (const s of readFss) {
      try {
        error = null
        if (!s.readdirSync) throw new Error('readdirSync not found')
        for (const entry of s.readdirSync.apply(s, args)) {
          result.set(getPathFromReaddirEntry(entry), entry)
        }
      } catch (e) {
        error = e
      }
    }
    if (error && result.size === 0) {
      throw error
    }

    return getSortedArrayFromReaddirResult(result)
  }

  ufs.readdir = (...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      return realFs.readdir(...args)
    }

    let cbArgIndex = args.length - 1
    let cb = args[cbArgIndex]

    if (typeof cb !== 'function') {
      cb = null
      cbArgIndex++
    }

    let error: Error = null
    const result = new Map<string, ReaddirEntry>()

    const iterate = (i: number, err: Error) => {
      if (err) {
        error = err
      }

      if (i >= readFss.length) {
        if (cb) cb(error)
        return
      }

      args[cbArgIndex] = (e, entries: ReaddirEntry[]) => {
        if (result.size === 0 && e) {
          return iterate(i + 1, e)
        }

        if (entries) {
          for (const entry of entries) {
            result.set(getPathFromReaddirEntry(entry), entry)
          }
        }

        if (i === readFss.length - 1) {
          cb(null, getSortedArrayFromReaddirResult(result))
        } else {
          iterate(i + 1, e)
        }
      }

      const s = readFss[i]
      const func = s.readdir

      if (!func) {
        iterate(i + 1, new Error('readdir not found'))
      } else {
        func.apply(s, args)
      }
    }
    iterate(0, null)
  }

  ufs.promises.readdir = async (...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      return realFs.promises.readdir(...args)
    }

    let error: Error = null
    const result = new Map<string, ReaddirEntry>()

    for (const s of readFss) {
      try {
        error = null
        if (!s.promises?.readdir) throw new Error('promises.readdir not found')
        for (const entry of await s.promises.readdir.apply(s, args)) {
          result.set(getPathFromReaddirEntry(entry), entry)
        }
      } catch (e) {
        error = e
      }
    }

    if (error) {
      throw error
    }
    return getSortedArrayFromReaddirResult(result)
  }

  ufs.createReadStream = (path: string) => {
    if (!ufs._enabled) {
      ufs.ReadStream = realFs.ReadStream
      return realFs.createReadStream(path)
    }

    let error: Error = null

    for (const s of readFss) {
      try {
        if (!s.createReadStream) throw new Error('createReadStream not found')

        const stream = s.createReadStream(path)
        if (!stream) {
          throw new Error('couldn\'t create read stream')
        }
        ufs.ReadStream = s.ReadStream
        return stream
      } catch (e) {
        error = e
      }
    }

    throw error
  }

  ufs.createWriteStream = (path: string) => {
    if (!ufs._enabled) {
      ufs.WriteStream = realFs.WriteStream
      return realFs.createWriteStream(path)
    }

    let error: Error = null

    for (const s of writeFss) {
      try {
        if (!s.createWriteStream) throw new Error('createWriteStream not found')

        const stream = s.createWriteStream(path)
        if (!stream) {
          throw new Error('couldn\'t create write stream')
        }
        ufs.WriteStream = s.WriteStream
        return stream
      } catch (e) {
        error = e
      }
    }

    throw error
  }

  ufs.writeFile = (path, ...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      return realFs.writeFile(path, ...args)
    }

    memfs.mkdirpSync(dirname(path))
    // @ts-ignore
    return memfs.writeFile(path, ...args)
  }

  ufs.writeFileSync = (path, ...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      return realFs.writeFileSync(path, ...args)
    }

    memfs.mkdirpSync(dirname(path))
    // @ts-ignore
    return memfs.writeFileSync(path, ...args)
  }

  ufs.promises.writeFile = (path, ...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      return realFs.promises.writeFile(path, ...args)
    }

    memfs.mkdirpSync(dirname(path))
    // @ts-ignore
    return memfs.promises.writeFile(path, ...args)
  }

  const origOpen = ufs.open
  ufs.open = (path, ...args) => {
    if (!ufs._enabled) {
      // @ts-ignore
      return realFs.open(path, ...args)
    }

    if (args[0].includes('w')) {
      memfs.mkdirpSync(dirname(path))
      // @ts-ignore
      return memfs.open(path, ...args)
    } else {
      // @ts-ignore
      return origOpen(path, ...args)
    }
  }

  _ufs = ufs

  patchFs(ufs)

  return ufs
}

function patchFs (ufs): () => void {
  // Monkey patch
  const unpatch = patch(ufs)

  // Patch <method>.native()
  for (const key in realFs) {
    if (realFs[key]?.native && !fs[key].native) {
      fs[key].native = (...args) => ufs[key].bind(ufs)(...args)
    }
  }

  return () => {
    unpatch()
  }
}

function createFSWatcherProxy (watchers: fs.FSWatcher[]) {
  return new Proxy(
    {},
    {
      get (_obj, property) {
        const funcCallers: Array<[fs.FSWatcher, Function]> = []
        let prop: Function | undefined
        for (const watcher of watchers) {
          prop = watcher[property]
          // if we're a function we wrap it in a bigger caller
          if (typeof prop === 'function') {
            funcCallers.push([watcher, prop])
          }
        }

        if (funcCallers.length) {
          return (...args) => {
            for (const [watcher, func] of funcCallers) {
              func.apply(watcher, args)
            }
          }
        } else {
          return prop
        }
      },
    },
  )
}

function getPathFromReaddirEntry (readdirEntry: ReaddirEntry): string {
  if (readdirEntry instanceof Buffer || typeof readdirEntry === 'string') {
    return String(readdirEntry)
  }
  return readdirEntry.name
}

function getSortedArrayFromReaddirResult (readdirResult: Map<string, ReaddirEntry>): ReaddirEntry[] {
  const array: ReaddirEntry[] = []
  for (const key of Array.from(readdirResult.keys()).sort()) {
    const value = readdirResult.get(key)
    if (value !== undefined) array.push(value)
  }
  return array
}

const specialMethods = [
  'existsSync',
  'readdir',
  'readdirSync',
  'createReadStream',
  'createWriteStream',
  'watch',
  'watchFile',
  'unwatchFile',
]

const fsSyncMethodsRead = [
  'accessSync',
  'closeSync',
  'createReadStream',
  'existsSync',
  'fstatSync',
  'ftruncateSync',
  'lstatSync',
  'openSync',
  'readdirSync',
  'readFileSync',
  'readlinkSync',
  'readSync',
  'realpathSync',
  'statSync',
]

const fsSyncMethodsWrite = [
  'appendFileSync',
  'chmodSync',
  'chownSync',
  'copyFileSync',
  'createWriteStream',
  'fchmodSync',
  'fchownSync',
  'fdatasyncSync',
  'fsyncSync',
  'futimesSync',
  'lchmodSync',
  'lchownSync',
  'linkSync',
  'mkdirSync',
  'mkdtempSync',
  'renameSync',
  'rmdirSync',
  'symlinkSync',
  'truncateSync',
  'unlinkSync',
  'utimesSync',
  'writeFileSync',
  'writeSync',
]

const fsAsyncMethodsRead = [
  'access',
  'close',
  'exists',
  'fstat',
  'lstat',
  'open',
  'read',
  'readdir',
  'readFile',
  'readlink',
  'realpath',
  'stat',
  'unwatchFile',
  'watch',
  'watchFile',
]

const fsAsyncMethodsWrite = [
  'appendFile',
  'chmod',
  'chown',
  'copyFile',
  'fchmod',
  'fchown',
  'fdatasync',
  'fsync',
  'ftruncate',
  'futimes',
  'lchmod',
  'lchown',
  'link',
  'mkdir',
  'mkdtemp',
  'rename',
  'rmdir',
  'symlink',
  'truncate',
  'unlink',
  'utimes',
  'write',
  'writeFile',
]

const fsPromiseMethodsRead = [
  'access',
  'lstat',
  'open',
  'opendir',
  'readdir',
  'readFile',
  'readlink',
  'realpath',
  'stat',
]

const fsPromiseMethodsWrite = [
  'appendFile',
  'chmod',
  'chown',
  'copyFile',
  'lchmod',
  'lchown',
  'link',
  'mkdir',
  'mkdtemp',
  'rename',
  'rmdir',
  'symlink',
  'truncate',
  'unlink',
  'utimes',
  'writeFile',
]
