import chokidar from 'chokidar'
import { join } from 'path'
import { Context } from './context'
import { run } from './run'
import { isRunning, settings, testFiles } from './schema'

let changedFiles: string[] = []
let timer

export async function setupRunWatch (ctx: Context) {
  const watchBase = ctx.config.watchBaseDirectory ?? ctx.config.targetDirectory
  const watcher = chokidar.watch(ctx.config.watchMatch, {
    cwd: watchBase,
    persistent: true,
    ignorePermissionErrors: true,
    ignored: ctx.config.watchIgnored,
  })

  watcher.on('change', (relativePath) => {
    const path = join(watchBase, relativePath)
    if (settings.watch) {
      changedFiles.push(path)
      if (timer) clearTimeout(timer)
      if (!isRunning()) {
        timer = setTimeout(() => {
          mightRunOnChangedFiles(ctx)
        }, ctx.config.watchThrottle)
      }
    }
  })
}

export function mightRunOnChangedFiles (ctx: Context) {
  const files = getTestFilesWithChangedModules(ctx, changedFiles)
  changedFiles = []
  if (files.length) {
    run(ctx, {
      testFileIds: files.map(f => f.id),
    })
  }
}

export function getTestFilesWithChangedModules (ctx: Context, files: string[]) {
  return testFiles.filter(f => !f.deleted && f.modules.some(m => files.includes(m)))
}
