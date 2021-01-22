import path from 'path'
import chalk from 'chalk'
import {
  Service,
  Message,
  Loader,
  TransformOptions,
  TransformResult,
} from 'esbuild'
import mergeSourceMap from 'merge-source-map'
import { SourceMap } from 'rollup'
import consola from 'consola'
import { cleanUrl } from './net'
import { generateCodeFrame } from './code'

// lazy start the service
let _servicePromise: Promise<Service> | undefined

export interface ESBuildOptions extends TransformOptions {
  include?: string | RegExp | string[] | RegExp[]
  exclude?: string | RegExp | string[] | RegExp[]
  jsxInject?: string
}

export async function ensureService () {
  if (!_servicePromise) {
    _servicePromise = require('esbuild').startService()
  }
  return _servicePromise!
}

export async function stopService () {
  if (_servicePromise) {
    const service = await _servicePromise
    service.stop()
    _servicePromise = undefined
  }
}

export type EsbuildTransformResult = Omit<TransformResult, 'map'> & {
  map: SourceMap
}

export async function transformWithEsbuild (
  code: string,
  filename: string,
  options?: TransformOptions,
  inMap?: object,
): Promise<EsbuildTransformResult> {
  const service = await ensureService()
  // if the id ends with a valid ext, use it (e.g. vue blocks)
  // otherwise, cleanup the query before checking the ext
  const ext = path.extname(
    /\.\w+$/.test(filename) ? filename : cleanUrl(filename),
  )
  const resolvedOptions = {
    loader: ext.slice(1) as Loader,
    sourcemap: true,
    // ensure source file name contains full query
    sourcefile: filename,
    ...options,
  } as ESBuildOptions

  delete resolvedOptions.include
  delete resolvedOptions.exclude
  delete resolvedOptions.jsxInject

  try {
    const result = await service.transform(code, resolvedOptions)
    if (inMap) {
      const nextMap = JSON.parse(result.map)
      // merge-source-map will overwrite original sources if newMap also has
      // sourcesContent
      nextMap.sourcesContent = []
      return {
        ...result,
        map: mergeSourceMap(inMap, nextMap) as SourceMap,
      }
    } else {
      return {
        ...result,
        map: JSON.parse(result.map),
      }
    }
  } catch (e) {
    consola.error('esbuild error with options used: ', resolvedOptions)
    // patch error information
    if (e.errors) {
      e.frame = ''
      e.errors.forEach((m: Message) => {
        e.frame += '\n' + prettifyMessage(m, code)
      })
      e.loc = e.errors[0].location
    }
    throw e
  }
}

function prettifyMessage (m: Message, code: string): string {
  let res = chalk.yellow(m.text)
  if (m.location) {
    const lines = code.split(/\r?\n/g)
    const line = Number(m.location.line)
    const column = Number(m.location.column)
    const offset =
      lines
        .slice(0, line - 1)
        .map((l) => l.length)
        .reduce((total, l) => total + l + 1, 0) + column
    res += '\n' + generateCodeFrame(code, offset, offset + 1)
  }
  return res + '\n'
}
