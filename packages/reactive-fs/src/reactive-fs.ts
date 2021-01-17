import {
  effect as rawEffect,
  ReactiveEffect,
  stop as stopEffect,
} from '@vue/reactivity'
import { ReactiveFileSystemOptions } from './options'
import { createContext } from './context'
import { createFileWatcher } from './watcher'
import { createReactiveFile } from './file'

export async function createReactiveFileSystem (options: ReactiveFileSystemOptions) {
  const ctx = createContext(options)

  const watcher = await createFileWatcher(ctx)

  const effects: ReactiveEffect<unknown>[] = []

  function effect (callback: () => unknown) {
    const e = rawEffect(callback)
    effects.push(e)
    return e
  }

  function watchFile (relativePath: string, handler: (content: string, oldContent: string) => unknown): () => void {
    let oldValue
    const e = effect(() => {
      const value = ctx.state.files[relativePath]?.content
      if (value !== oldValue) {
        handler(value, oldValue)
        oldValue = value
      }
    })
    return () => {
      const index = effects.indexOf(e)
      if (index !== -1) {
        stopEffect(e)
        effects.splice(index, 1)
      }
    }
  }

  function createFile (relativePath: string, content: string = null) {
    const file = ctx.state.files[relativePath] || createReactiveFile(ctx, relativePath)
    if (content != null) {
      file.content = content
    }
    return file
  }

  async function destroy () {
    for (const e of effects) {
      stopEffect(e)
    }
    effects.length = 0
    await watcher.close()
    await Promise.all(ctx.fsQueue)
  }

  return {
    state: ctx.state,
    get files () {
      return ctx.state.files
    },
    createFile,
    effect,
    watchFile,
    destroy,
  }
}
