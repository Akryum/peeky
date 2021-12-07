/* eslint-disable @typescript-eslint/camelcase */

import { resolve, dirname, relative } from 'path'
import { builtinModules, createRequire } from 'module'
import vm from 'vm'
import { pathToFileURL } from 'url'
import { ViteDevServer, InlineConfig, createServer, mergeConfig } from 'vite'
import chalk from 'chalk'
import shortid from 'shortid'
import { isEqual } from 'lodash-es'
import match from 'anymatch'
import { ExternalOption } from '@peeky/config'
import { slash } from '@peeky/utils'
import { mockedModules } from './mocked-files.js'
import { createPeekyGlobal } from '../index.js'

let viteServer: ViteDevServer
let initPromise: Promise<void>
const moduleCache: Map<string, Promise<ViteExecutionResult>> = new Map()

export interface InitViteServerOptions {
  defaultConfig: InlineConfig
  userInlineConfig: InlineConfig
  configFile: string
  rootDir: string
  external: ExternalOption
}

let currentOptions: InitViteServerOptions
let lastOptions: InitViteServerOptions
let initId: string

export async function initViteServer (options: InitViteServerOptions) {
  if (initPromise && isEqual(lastOptions, options)) return initPromise

  const currentInitId = initId = shortid()

  // eslint-disable-next-line no-async-promise-executor
  initPromise = new Promise(async (resolve, reject) => {
    try {
      await stopViteServer()

      lastOptions = options

      currentOptions = {
        ...options,
      }

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

export interface ViteExecutionResult {
  exports: any
  deps: string[]
}

export async function executeWithVite (file: string, executionContext: Record<string, any>): Promise<ViteExecutionResult> {
  if (!viteServer) {
    throw new Error('Vite server is not initialized, use `initViteServer` first')
  }
  const fileId = `/@fs/${slash(resolve(file))}`
  const deps = new Set<string>()
  const exports = await cachedRequest(fileId, [], deps, executionContext)
  return {
    exports,
    deps: Array.from(deps),
  }
}

export function getFileDependencies (id: string, entryFiles: string[], result = new Set<string>(), seen = new Set<string>()): Set<string> {
  if (seen.has(id) || result.has(id)) {
    return result
  }

  seen.add(id)
  if (entryFiles.includes(id)) {
    result.add(id)
    return result
  }

  const mod = viteServer.moduleGraph.getModuleById(id)

  if (mod) {
    mod.importers.forEach((i) => {
      if (i.id) {
        getFileDependencies(i.id, entryFiles, result, seen)
      }
    })
  }

  return result
}

/**
 * Can return a cached request
 * @param rawId
 * @param callstack To detect circular dependencies
 * @returns
 */
function cachedRequest (rawId: string, callstack: string[], deps: Set<string>, executionContext: Record<string, any>): Promise<any> {
  if (builtinModules.includes(rawId)) {
    return import(rawId)
  }

  const id = normalizeId(rawId)
  const realPath = toFilePath(id)

  if (mockedModules.has(realPath)) {
    return Promise.resolve(mockedModules.get(realPath))
  }

  if (shouldExternalize(realPath)) {
    return import(realPath)
  }

  if (moduleCache.has(id)) {
    return moduleCache.get(id)
  }

  const promise = rawRequest(id, realPath, callstack, deps, executionContext)
  moduleCache.set(id, promise)
  return promise
}

async function rawRequest (id: string, realPath: string, callstack: string[], deps: Set<string>, executionContext: Record<string, any>): Promise<any> {
  // Circular dependencies detection
  callstack = [...callstack, id]
  const request = async (dep: string) => {
    if (callstack.includes(dep)) {
      throw new Error(`${chalk.red('Circular dependency detected')}\nStack:\n${[...callstack, dep].reverse().map((i) => {
        const path = relative(viteServer.config.root, toFilePath(normalizeId(i)))
        return chalk.dim(' -> ') + (i === dep ? chalk.yellow(path) : path)
      }).join('\n')}\n`)
    }
    return cachedRequest(dep, callstack, deps, executionContext)
  }

  const result = await viteServer.transformRequest(id, { ssr: true })
  if (!result) {
    throw new Error(`failed to load ${id}`)
  }

  if (result.deps) {
    result.deps.forEach(dep => deps.add(toFilePath(normalizeId(dep))))
  }

  const url = pathToFileURL(realPath)
  const exports = {}

  const context = {
    require: createRequire(url),
    __filename: realPath,
    __dirname: dirname(realPath),
    __vite_ssr_import__: request,
    __vite_ssr_dynamic_import__: request,
    __vite_ssr_exports__: exports,
    __vite_ssr_exportAll__: (obj: any) => exportAll(exports, obj),
    __vite_ssr_import_meta__: { url },
    ...executionContext,
    peeky: createPeekyGlobal({
      filename: realPath,
    }),
  }

  const fn = vm.runInThisContext(`async (${Object.keys(context).join(',')}) => { ${result.code} }`, {
    filename: realPath,
  })
  await fn(...Object.values(context))

  return exports
}

function normalizeId (id: string): string {
  // Virtual modules start with `\0`
  if (id && id.startsWith('/@id/__x00__')) { id = `\0${id.slice('/@id/__x00__'.length)}` }
  if (id && id.startsWith('/@id/')) { id = id.slice('/@id/'.length) }
  return id
}

function toFilePath (id: string): string {
  let absolute = id.startsWith('/@fs/')
    ? id.slice(4)
    : id.startsWith(dirname(viteServer.config.root))
      ? id
      : id.startsWith('/')
        ? slash(resolve(viteServer.config.root, id.slice(1)))
        : id

  if (absolute.startsWith('//')) { absolute = absolute.slice(1) }
  if (!absolute.startsWith('/')) { absolute = `/${absolute}` }

  return absolute
}

function exportAll (exports: any, sourceModule: any) {
  for (const key in sourceModule) {
    if (key !== 'default') {
      try {
        Object.defineProperty(exports, key, {
          enumerable: true,
          configurable: true,
          get () { return sourceModule[key] },
        })
      } catch (_err) { }
    }
  }
}

function shouldExternalize (filePath: string): boolean {
  if (typeof currentOptions.external === 'function') {
    return currentOptions.external(filePath)
  }

  const filters = Array.isArray(currentOptions.external) ? currentOptions.external : [currentOptions.external]

  return filters.some(filter => {
    if (typeof filter === 'string') {
      return match(filter, filePath)
    } else if (filter instanceof RegExp) {
      return filter.test(filePath)
    }
  })
}
