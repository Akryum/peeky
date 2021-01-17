import { reactive } from '@vue/reactivity'
import { ReactiveFile } from './file'
import { ReactiveFileSystemOptions } from './options'

export interface Context {
  options: ReactiveFileSystemOptions
  state: {
    files: { [path: string]: ReactiveFile }
  }
  fsQueue: Promise<unknown>[]
}

export function createContext (options: ReactiveFileSystemOptions): Context {
  return {
    options,
    state: reactive({
      files: {},
    }),
    fsQueue: [],
  }
}
