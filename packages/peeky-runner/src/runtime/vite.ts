/**
 * Some code adapted from vitest https://github.com/antfu-sponsors/vitest by @antfu and @patak
 */

/* eslint-disable @typescript-eslint/no-empty-function */

import { resolve, dirname, relative } from 'path'
import { builtinModules, createRequire } from 'module'
import vm from 'vm'
import { fileURLToPath, pathToFileURL } from 'url'
import chalk from 'chalk'
import { isValidNodeImport } from 'mlly'
import type { ModuleFilterOption, ModuleFilter } from '@peeky/config'
import { slash, isWindows, fixWindowsAbsoluteFileUrl } from '@peeky/utils'
import { moduleCache, sourceMaps } from './module-cache.js'
import { mockedModules } from './mocked-files.js'
import { createPeekyGlobal } from './peeky-global/index.js'

export interface RuntimeViteOptions {
  rootDir: string
  exclude: ModuleFilterOption
  include: ModuleFilterOption
}

export interface ViteExecutionResult {
  exports: any
  deps: string[]
}

/**
 * Stubs modules (internal, do not clear)
 */
export const stubbedRequests: Record<string, any> = {
  '/@vite/client': {
    injectQuery: (id: string) => id,
    createHotContext () {
      return {
        accept: () => {},
        prune: () => {},
      }
    },
    updateStyle () {},
  },
}

interface ExecutionContext {
  callstack: string[]
  deps: Set<string>
  globals: Record<string, any>
  root: string
  externalsCache: Set<string>
}

export function useVite (options: RuntimeViteOptions, transform: (id: string) => Promise<any>) {
  async function executeWithVite (file: string, globals: Record<string, any>, root: string): Promise<ViteExecutionResult> {
    const fileId = `/@fs/${slash(resolve(file))}`
    const ctx: ExecutionContext = {
      callstack: [],
      deps: new Set(),
      globals,
      root,
      externalsCache: new Set(),
    }
    const exports = await cachedRequest(fileId, ctx)
    return {
      exports,
      deps: Array.from(ctx.deps),
    }
  }

  /**
   * Can return a cached request
   * @param rawId
   * @param callstack To detect circular dependencies
   * @param deps Dependency graph
   * @param executionContext Globals to pass to the execution VM
   * @returns Executed module exports
   */
  async function cachedRequest (rawId: string, ctx: ExecutionContext): Promise<any> {
    if (builtinModules.includes(rawId)) {
      return import(rawId)
    }

    const id = normalizeId(rawId)
    const realPath = toFilePath(id, ctx.root)

    if (mockedModules.has(realPath)) {
      return Promise.resolve(mockedModules.get(realPath))
    }

    if (id in stubbedRequests) {
      return Promise.resolve(stubbedRequests[id])
    }

    if (moduleCache.has(realPath)) {
      return moduleCache.get(realPath)
    }

    if (ctx.externalsCache.has(realPath)) {
      return import(fixWindowsAbsoluteFileUrl(realPath))
    }

    try {
      if (await shouldExternalize(realPath)) {
        const exports = await import(fixWindowsAbsoluteFileUrl(realPath))
        ctx.externalsCache.add(realPath)
        return exports
      }
    } catch (e) {
      e.message = `${e.message}(${id})`
      throw e
    }

    const promise = rawRequest(id, realPath, ctx)
    moduleCache.set(realPath, promise)
    return promise
  }

  /**
   * Transform a module with vite then execute if in a VM
   * @param id
   * @param realPath
   * @param callstack To detect circular dependencies
   * @param deps Dependency graph
   * @param executionContext Globals to pass to the VM
   * @param root Root directory path
   * @returns Executed module exports
   */
  async function rawRequest (id: string, realPath: string, ctx: ExecutionContext): Promise<any> {
    const peekyGlobals = createPeekyGlobal({
      filename: realPath,
    })

    // @peeky/test package stub
    const peekyTestStub = () => ({
      ...peekyGlobals,
      ...ctx.globals,
    })

    // Circular dependencies detection
    ctx.callstack = [...ctx.callstack, realPath]
    const request = async (dep: string) => {
      if (dep.includes('@peeky/test') || dep.includes('peeky-test')) {
        return peekyTestStub()
      }

      if (ctx.callstack.includes(dep)) {
        const cacheKey = toFilePath(normalizeId(dep), ctx.root)
        if (!moduleCache.has(cacheKey)) {
          throw new Error(`${chalk.red('Circular dependency detected')}\nStack:\n${[...ctx.callstack, dep].reverse().map((i) => {
            const path = relative(options.rootDir, toFilePath(normalizeId(i), ctx.root))
            return chalk.dim(' -> ') + (i === dep ? chalk.yellow(path) : path)
          }).join('\n')}\n`)
        } else {
          return (await moduleCache.get(cacheKey)).exports
        }
      }
      return cachedRequest(dep, ctx)
    }

    let result

    try {
      result = await transform(id)
      if (!result) {
        throw new Error(`failed to load ${id}`)
      }

      if (result.deps) {
        result.deps.forEach(dep => ctx.deps.add(toFilePath(normalizeId(dep), ctx.root)))
      }

      if (result.map) {
        sourceMaps.set(realPath, result.map)
      }

      const url = pathToFileURL(realPath).href

      const exports: any = {}
      const moduleProxy = {
        set exports (value) {
          exportAll(exports, value)
          exports.default = value
        },
        get exports () {
          return exports.default
        },
      }

      const context = {
      // Vite SSR transforms
        __vite_ssr_import__: request,
        __vite_ssr_dynamic_import__: request,
        __vite_ssr_exports__: exports,
        __vite_ssr_exportAll__: (obj: any) => exportAll(exports, obj),
        __vite_ssr_import_meta__: { url },
        // CJS compatibility
        require: createRequire(url),
        exports,
        module: moduleProxy,
        __filename: realPath,
        __dirname: dirname(realPath),
        // Peeky globals
        ...ctx.globals,
        peeky: peekyGlobals,
      }
      const fn = vm.runInThisContext(`async (${Object.keys(context).join(',')}) => { ${result.code}\n }`, {
        filename: realPath,
      })
      await fn(...Object.values(context))

      return exports
    } catch (e) {
      e.message = `${e.message} (${id})`
      throw e
    }
  }

  /**
   * Check if a module should not be processed by Vite
   * @param filePath
   * @returns
   */
  async function shouldExternalize (filePath: string): Promise<boolean> {
    if (matchModuleFilter(options.include as ModuleFilter[], filePath)) {
      return false
    }

    if (matchModuleFilter(options.exclude as ModuleFilter[], filePath)) {
      return true
    }

    return filePath.includes('/node_modules/') && await isValidNodeImport(filePath)
  }

  return {
    executeWithVite,
  }
}

/**
 * Normalize Vite module id
 * @param id
 * @returns
 */
function normalizeId (id: string): string {
  return id
    .replace(/^\/@id\/__x00__/, '\0') // virtual modules start with `\0`
    .replace(/^\/@id\//, '')
    .replace(/^__vite-browser-external:/, '')
    .replace(/^node:/, '')
    .replace(/[?&]v=\w+/, '?') // remove ?v= query
    .replace(/\?$/, '') // remove end query mark
}

/**
 * Convert a normalized vite id to an absolute file system path
 * @param id Normalized vite id
 * @param root Root directory
 * @returns
 */
function toFilePath (id: string, root: string): string {
  let absolute = slash(id).startsWith('/@fs/')
    ? id.slice(4)
    : id.startsWith(dirname(root))
      ? id
      : id.startsWith('/')
        ? slash(resolve(root, id.slice(1)))
        : id

  if (absolute.startsWith('//')) { absolute = absolute.slice(1) }

  // disambiguate the `<UNIT>:/` on windows: see nodejs/node#31710
  return isWindows && absolute.startsWith('/')
    ? fileURLToPath(pathToFileURL(absolute.slice(1)).href)
    : absolute
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

function matchModuleFilter (filters: ModuleFilter[], filePath: string): boolean {
  return filters.some(filter => {
    if (typeof filter === 'function') {
      return filter(filePath)
    } else if (typeof filter === 'string') {
      return filePath.includes(filter)
    } else {
      return filter.test(filePath)
    }
  })
}
