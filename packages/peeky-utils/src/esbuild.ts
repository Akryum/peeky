import { extname } from 'pathe'
import chalk from 'chalk'
import {
  Message,
  Loader,
  TransformOptions,
  TransformResult,
  transform,
} from 'esbuild'
import mergeSourceMap from 'merge-source-map'
import { SourceMap } from 'rollup'
import consola from 'consola'
import { cleanUrl } from './net.js'
import { generateCodeFrame } from './code.js'
export interface ESBuildOptions extends TransformOptions {
  include?: string | RegExp | string[] | RegExp[]
  exclude?: string | RegExp | string[] | RegExp[]
  jsxInject?: string
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
  // if the id ends with a valid ext, use it (e.g. vue blocks)
  // otherwise, cleanup the query before checking the ext
  const ext = extname(
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
    const result = await transform(code, resolvedOptions)
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
