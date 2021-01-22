import { createReactiveFileSystem } from '@peeky/reactive-fs'
import { peekyConfigFileMatch } from './defaults'

export async function setupConfigContentLoader (baseDir: string = process.cwd(), glob: string | string[] = peekyConfigFileMatch) {
  const fs = await createReactiveFileSystem({
    baseDir,
    glob,
    ignored: ['node_modules'],
  })

  function getConfigPath () {
    const [filePath] = fs.list('.', { excludeSubDirectories: true })
    return filePath
  }

  function loadConfigFileContent () {
    return fs.files[getConfigPath()]?.waitForContent
  }

  function readConfigFileContent () {
    return fs.files[getConfigPath()]?.content
  }

  function watchConfigFileContent (handler: (content: string, fileName: string) => unknown) {
    let oldContent: string
    fs.effect(() => {
      const content = readConfigFileContent()
      if (content != null && content !== oldContent) {
        oldContent = content
        handler(content, getConfigPath())
      }
    })
  }

  function destroy () {
    return fs.destroy()
  }

  return {
    getConfigPath,
    loadConfigFileContent,
    readConfigFileContent,
    watchConfigFileContent,
    destroy,
  }
}
