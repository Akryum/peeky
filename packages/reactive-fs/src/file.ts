import { markRaw, ref, Ref } from '@vue/reactivity'
import { existsSync, move, readFile, remove, writeFile } from 'fs-extra'
import { join } from 'path'
import { Context } from './context'

export interface ReactiveFile {
  relativePath: string
  absolutePath: string
  time: number
  content: string
  waitForContent: Promise<string>
  refresh: () => void
  remove: () => void
  move: (newRelativePath: string) => void
}

interface InternalFile {
  active: boolean
  content: Ref<string>
}

export function createReactiveFile (ctx: Context, relativePath: string) {
  const file: ReactiveFile & {
    _internal: InternalFile
  } = markRaw({
    relativePath,
    absolutePath: join(ctx.options.baseDir, relativePath),
    time: Date.now(),
    get content () {
      if (!file._internal.active) {
        activate()
      }
      return file._internal.content.value
    },
    set content (value) {
      setContent(value)
      queueFsOp(ctx, writeFile(file.absolutePath, value, 'utf8'))
    },
    get waitForContent () {
      // Track content for reactivity
      // eslint-disable-next-line no-unused-expressions
      file._internal.content.value
      return activate()
    },
    refresh () {
      read()
    },
    remove () {
      if (ctx.state.files[file.relativePath]) {
        delete ctx.state.files[file.relativePath]
        queueFsOp(ctx, remove(file.absolutePath))
      }
    },
    move (newRelativePath) {
      const oldRelativePath = file.relativePath
      if (oldRelativePath === newRelativePath) return
      file.relativePath = newRelativePath
      const oldAbsolutePath = file.absolutePath
      file.absolutePath = join(ctx.options.baseDir, newRelativePath)
      delete ctx.state.files[oldRelativePath]
      ctx.state.files[file.relativePath] = file
      queueFsOp(ctx, move(oldAbsolutePath, file.absolutePath, {
        overwrite: true,
      }))
    },
    _internal: {
      active: false,
      content: ref<string>(undefined),
    },
  })

  function activate (): Promise<string> {
    if (file._internal.active) return readPromise || Promise.resolve(null)
    file._internal.active = true
    return read()
  }

  let readPromise: Promise<string>

  function read (): Promise<string> {
    if (file._internal.active) {
      readPromise = new Promise(resolve => {
        queueFsOp(ctx, (async () => {
          if (existsSync(file.absolutePath)) {
            const result = await readFile(file.absolutePath, 'utf8')
            setContent(result)
            resolve(result)
          }
        })())
      })
      return readPromise
    }
    return Promise.resolve(null)
  }

  function setContent (value) {
    if (value !== file._internal.content.value) {
      file.time = Date.now()
      file._internal.content.value = value
    }
  }

  ctx.state.files[file.relativePath] = file

  return file as ReactiveFile
}

function queueFsOp (ctx: Context, op: Promise<unknown>) {
  ctx.fsQueue.push(op)
  return op.then(result => {
    const index = ctx.fsQueue.indexOf(op)
    if (index !== -1) ctx.fsQueue.splice(index, 1)
    return result
  })
}
