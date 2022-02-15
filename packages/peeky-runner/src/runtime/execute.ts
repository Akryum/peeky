import { ViteNodeRunner } from 'vite-node/client'
import type { ViteNodeRunnerOptions, ViteNodeResolveId } from 'vite-node'
import { mockedModules } from './mocked-files.js'
import { createPeekyGlobal } from './peeky-global/index.js'

export interface ExecuteFileOptions extends ViteNodeRunnerOptions {
  files: string[]
  globals: Record<string, any>
  resolveId: (id: string, importer?: string) => Promise<ViteNodeResolveId | null>
}

export async function execute (options: ExecuteFileOptions) {
  class Runner extends ViteNodeRunner {
    prepareContext (context: Record<string, any>) {
      const fsPath = context.__filename
      const request = context.__vite_ssr_import__

      const peekyGlobals = createPeekyGlobal({
        filename: fsPath,
      })

      // @peeky/test package stub
      const peekyTestStub = () => ({
        ...peekyGlobals,
        ...options.globals,
      })

      context.__vite_ssr_import__ = async (dep: string) => {
        if (dep.includes('@peeky/test') || dep.includes('peeky-test')) {
          return peekyTestStub()
        }

        const resolvedId = await options.resolveId(dep, fsPath)
        if (resolvedId && mockedModules.has(resolvedId.id)) {
          return Promise.resolve(mockedModules.get(resolvedId.id))
        }

        return request(dep)
      }

      Object.assign(context, {
        ...options.globals,
        peeky: peekyGlobals,
      })

      return context
    }
  }

  const runner = new Runner(options)
  const result = []
  for (const file of options.files) {
    result.push(await runner.executeFile(file))
  }
  return result
}
