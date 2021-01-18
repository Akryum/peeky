import chokidar from 'chokidar'
import { Context } from './context'
import { createReactiveFile } from './file'

export function createFileWatcher (ctx: Context): Promise<chokidar.FSWatcher> {
  return new Promise(resolve => {
    const watcher = chokidar.watch(ctx.options.glob, {
      cwd: ctx.options.baseDir,
      persistent: true,
      ignorePermissionErrors: true,
      ignored: ctx.options.ignored,
    })
    watcher.on('add', (path) => {
      createReactiveFile(ctx, path)
    })
    watcher.on('change', (path) => {
      const file = ctx.state.files[path]
      if (file) {
        file.refresh()
      }
    })
    watcher.on('unlink', (path) => {
      const file = ctx.state.files[path]
      if (file) {
        file.remove()
      }
    })
    watcher.on('ready', () => {
      resolve(watcher)
    })
  })
}
