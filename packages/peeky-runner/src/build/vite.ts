import { ViteDevServer, InlineConfig, createServer, mergeConfig, TransformResult } from 'vite'
import shortid from 'shortid'
import isEqual from 'lodash/isEqual.js'
import fs from 'fs-extra'
import { resolve } from 'pathe'

let viteServer: ViteDevServer
let initPromise: Promise<void>

export interface InitViteServerOptions {
  defaultConfig: InlineConfig
  userInlineConfig: InlineConfig
  configFile: string
  rootDir: string
}

let lastOptions: InitViteServerOptions
let initId: string

/**
 * Create a Vite server or reuse the existing one if options are the same
 * @param options
 * @returns
 */
export async function initViteServer (options: InitViteServerOptions) {
  if (initPromise && isEqual(lastOptions, options)) return initPromise

  const currentInitId = initId = shortid()

  // eslint-disable-next-line no-async-promise-executor
  initPromise = new Promise(async (resolve, reject) => {
    try {
      await stopViteServer()

      lastOptions = options

      const server = await createServer(mergeConfig(mergeConfig(options.defaultConfig ?? {}, options.userInlineConfig ?? {}), {
        logLevel: 'error',
        clearScreen: false,
        configFile: options.configFile,
        root: options.rootDir,
        resolve: {},
      }))
      await server.pluginContainer.buildStart({})

      if (initId === currentInitId) {
        viteServer = server
      } else {
        initPromise.then(resolve)
      }
    } catch (e) {
      reject(e)
    }
    resolve()
  })

  return initPromise
}

export async function stopViteServer () {
  if (viteServer) {
    await viteServer.close()
  }
}

/**
 * Select the correct vite mode to transform a module
 * @param id Module id
 * @returns Transformed code result object
 */
export async function transform (id: string): Promise<TransformResult> {
  if (id.match(/\.json$/)) {
    if (id.startsWith('/')) {
      id = id.substring(1)
    }
    id = resolve(lastOptions.rootDir, id)
    const code = `const data = ${await fs.readFile(id, { encoding: 'utf8' })};Object.assign(exports, data);exports.default = data;`
    return {
      code,
      map: null,
    }
  } else if (id.match(/\.(?:[cm]?[jt]sx?)$/)) {
    return await viteServer.transformRequest(id, { ssr: true })
  } else {
    // for components like Vue, we want to use the client side plugins
    // but then convert the code to be consumed by the server
    const result = await viteServer.transformRequest(id)
    if (!result) {
      return undefined
    }
    return await viteServer.ssrTransform(result.code, result.map, id)
  }
}
