import { markRaw, ref, Ref } from '@vue/reactivity'
import { move, readFile, remove, writeFile } from 'fs-extra'
import { join } from 'path'
import { Context } from './context'

export interface ReactiveFile {
  relativePath: string
  absolutePath: string
  time: number
  content: string
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
      content: ref<string>(null),
    },
  })

  function activate () {
    if (file._internal.active) return
    file._internal.active = true
    read()
  }

  function read () {
    if (file._internal.active) {
      queueFsOp(ctx, (async () => {
        const result = await readFile(file.absolutePath, 'utf8')
        setContent(result)
      })())
    }
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
