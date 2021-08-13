import {
  effect as rawEffect,
  ReactiveEffectRunner,
  stop as stopEffect,
} from '@vue/reactivity'
import { ReactiveFileSystemOptions } from './options'
import { createContext } from './context'
import { createFileWatcher } from './watcher'
import { createReactiveFile } from './file'
import { areDifferent } from './util'

export interface ListOptions {
  excludeSubDirectories?: boolean
}

export async function createReactiveFileSystem (options: ReactiveFileSystemOptions) {
  const ctx = createContext(options)

  const watcher = await createFileWatcher(ctx)

  const effects: ReactiveEffectRunner<unknown>[] = []

  function effect (callback: () => unknown) {
    const e = rawEffect(callback)
    effects.push(e)
    return e
  }

  function removeEffect (e: ReactiveEffectRunner<unknown>) {
    const index = effects.indexOf(e)
    if (index !== -1) {
      stopEffect(e)
      effects.splice(index, 1)
    }
  }

  function watch<T = unknown> (source: () => T, handler: (value: T, oldValue: T) => unknown) {
    let oldValue
    const e = effect(() => {
      const value = source()
      if (areDifferent(value, oldValue)) {
        handler(value, oldValue)
        oldValue = value
      }
    })
    return () => removeEffect(e)
  }

  function watchFile (relativePath: string, handler: (content: string, oldContent: string) => unknown): () => void {
    return watch<string>(() => ctx.state.files[relativePath]?.content, handler)
  }

  function createFile (relativePath: string, content: string = null) {
    const file = ctx.state.files[relativePath] || createReactiveFile(ctx, relativePath)
    if (content != null) {
      file.content = content
    }
    return file
  }

  function list (folderRelativePath = '', options: ListOptions = {}) {
    folderRelativePath = folderRelativePath.replace(/^\.\/?/, '')
    return Object.keys(ctx.state.files).filter(
      key => key.startsWith(folderRelativePath) &&
      (!options.excludeSubDirectories || !key.substr(folderRelativePath.length).includes('/')),
    ).sort()
  }

  function watchList (folderRelativePath = '', handler: (list: string[], oldList: string[]) => unknown, options: ListOptions = {}) {
    return watch<string []>(() => list(folderRelativePath, options), handler)
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
    watch,
    watchFile,
    list,
    watchList,
    destroy,
    onFileAdd: (handler: (relativePath: string) => unknown) => {
      watcher.on('add', (relativePath) => {
        handler(relativePath)
      })
    },
    onFileChange: (handler: (relativePath: string) => unknown) => {
      watcher.on('change', (relativePath) => {
        handler(relativePath)
      })
    },
    onFileRemove: (handler: (relativePath: string) => unknown) => {
      watcher.on('unlink', (relativePath) => {
        handler(relativePath)
      })
    },
  }
}

type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T

export type ReactiveFileSystem = Awaited<ReturnType<typeof createReactiveFileSystem>>
