import fs from 'fs'
import path from 'path'
import match from 'anymatch'
import { V8Coverage } from 'collect-v8-coverage'
import { SourceMapConsumer } from 'source-map'
import copy from 'fast-copy'
import glob from 'fast-glob'
import shortid from 'shortid'
import type { Context } from '../types'

export interface FileCoverage {
  path: string
  functions: FunctionCoverage[]
  lineRanges: CoverageLineRange[]
  linesCovered: number
  linesTotal: number
}

interface InternalFileCoverage extends Omit<FileCoverage, 'functions' | 'linesCovered'> {
  functions: Map<string, FunctionCoverage>
}

export interface FunctionCoverage {
  name: string
  covered: boolean
}

export interface CoverageLineRange {
  start: number
  end: number
}

export async function getCoverage (
  coverage: V8Coverage,
  ctx: Context,
): Promise<FileCoverage[]> {
  // Filter
  const filteredCoverage = coverage.filter(item => {
    if (!item.url.startsWith('file://')) return false
    const file = item.url.substr(7)
    return file.startsWith(ctx.options.coverage.root) &&
      !match(ctx.options.coverage.ignored, file)
  })

  const coverageItems: Map<string, InternalFileCoverage> = new Map()

  function addCoverage (fullPath: string, sourceContent: string, functionName: string, coveredRange?: CoverageLineRange) {
    let relativePath = path.relative(ctx.options.coverage.root, fullPath)
    if (relativePath.startsWith('..')) {
      relativePath = fullPath
    }
    if (match(ctx.options.coverage.ignored, relativePath)) return

    if (!functionName) {
      functionName = `anonymous-${shortid()}`
    }

    let fileCoverage: InternalFileCoverage = coverageItems.get(fullPath)
    if (!fileCoverage) {
      fileCoverage = {
        path: fullPath,
        functions: new Map(),
        lineRanges: [],
        linesTotal: getCoverageTotalLines(sourceContent),
      }
      coverageItems.set(fullPath, fileCoverage)
    }

    let functionCoverage = fileCoverage.functions.get(functionName)
    if (!functionCoverage) {
      functionCoverage = {
        name: functionName,
        covered: !!coveredRange,
      }
      fileCoverage.functions.set(functionName, functionCoverage)
    } else {
      functionCoverage.covered = !!coveredRange
    }

    if (coveredRange) {
      fileCoverage.lineRanges.push(coveredRange)
    }
  }

  for (const c of filteredCoverage) {
    const file = c.url.substr(7)
    const rawContent = fs.readFileSync(file, 'utf8')

    // Source map
    let sourceMapConsumer: SourceMapConsumer
    const sourceMapUrlMatch = rawContent.match(/\/\/# sourceMappingURL=(.*)/)
    if (sourceMapUrlMatch) {
      try {
        const sourceMapFile = path.resolve(path.dirname(file), sourceMapUrlMatch[1])
        if (fs.existsSync(sourceMapFile)) {
          const sourceMapSource = fs.readFileSync(sourceMapFile, 'utf8')
          const sourceMapRaw = JSON.parse(sourceMapSource)
          sourceMapConsumer = await new SourceMapConsumer(sourceMapRaw)
        }
      } catch (e) {
        console.error(`Error while parsing source map for ${file}: ${e.stack ?? e.message}`)
      }
    }

    // Functions
    for (const fn of c.functions) {
      for (const range of fn.ranges) {
        const rangeData: CoverageLineRange = {
          start: rawContent.substring(0, range.startOffset).split('\n').length,
          end: rawContent.substring(0, range.endOffset).split('\n').length,
        }
        const covered = range.count > 0

        // Source map correction
        if (sourceMapConsumer) {
          const original = sourceMapConsumer.originalPositionFor({
            line: rangeData.start,
            column: 0,
            bias: SourceMapConsumer.LEAST_UPPER_BOUND,
          })

          if (original.source == null) {
            // console.error(`Couldn't map source for ${file}`, rangeData, rawContent.substring(range.startOffset, range.endOffset))
            continue
          }

          rangeData.start = original.line

          if (covered) {
            const originalEnd = sourceMapConsumer.originalPositionFor({
              line: rangeData.end,
              column: 0,
              bias: SourceMapConsumer.GREATEST_LOWER_BOUND,
            })
            rangeData.end = originalEnd.line + 1
          }

          const fullPath = path.resolve(path.dirname(file), original.source)
          const sourceContent = sourceMapConsumer.sourceContentFor(original.source)
          addCoverage(fullPath, sourceContent, fn.functionName, covered ? rangeData : null)
        } else {
          addCoverage(file, rawContent, fn.functionName, covered ? rangeData : null)
        }
      }
    }
  }

  // Result
  return Array.from(coverageItems.values()).map(item => ({
    path: item.path,
    functions: Array.from(item.functions.values()),
    lineRanges: item.lineRanges,
    linesCovered: 0,
    linesTotal: item.linesTotal,
  }))
}

export function getCoverageTotalLines (sourceContent: string): number {
  if (!sourceContent) return 1
  return sourceContent
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
    // Remove import/exports
    .replace(/(import|export)[\s\S]*?from\s*("|')[\s\S]*?("|')/g, '')
    .split('\n').filter(line => !!line.trim()).length
}

export function mergeCoverage (coverages: FileCoverage[]): FileCoverage[] {
  const map = new Map<string, FileCoverage>()

  for (const coverage of coverages) {
    const existing = map.get(coverage.path)
    if (existing) {
      existing.functions = mergeFunctionCoverage(existing.functions.concat(coverage.functions))
      existing.lineRanges = mergeCoverageRanges(existing.lineRanges.concat(coverage.lineRanges))
    } else {
      map.set(coverage.path, copy(coverage))
    }
  }

  return Array.from(map.values())
}

export function mergeFunctionCoverage (functions: FunctionCoverage[]): FunctionCoverage[] {
  const map = new Map<string, FunctionCoverage>()

  for (const functionCoverage of functions) {
    const existing = map.get(functionCoverage.name)
    if (existing) {
      existing.covered = existing.covered || functionCoverage.covered
    } else {
      map.set(functionCoverage.name, copy(functionCoverage))
    }
  }

  return Array.from(map.values())
}

export function mergeCoverageRanges (ranges: CoverageLineRange[]): CoverageLineRange[] {
  const result: CoverageLineRange[] = []
  let lastRange: CoverageLineRange | undefined
  for (const range of ranges) {
    if (!lastRange || lastRange.end < range.start) {
      lastRange = copy(range)
      result.push(lastRange)
    } else {
      lastRange.end = Math.max(lastRange.end, range.end)
    }
  }

  return result
}

export function getCoveredLines (ranges: CoverageLineRange[]): number {
  return ranges.reduce((sum, range) => sum + (range.end - range.start + 1), 0)
}

export function computeCoveredLines (coverage: FileCoverage[]): FileCoverage[] {
  for (const file of coverage) {
    file.linesCovered = getCoveredLines(file.lineRanges)
  }
  return coverage
}

export async function getEmptyCoverageFromFiles (match: string | string[], baseDir: string, ignore: string | string[]): Promise<FileCoverage[]> {
  const files = await glob(Array.isArray(match) ? match : [match], {
    cwd: baseDir,
    ignore: Array.isArray(ignore) ? ignore : [ignore],
    absolute: true,
  })
  return files.map(file => ({
    path: file,
    functions: [],
    lineRanges: [],
    linesTotal: getCoverageTotalLines(fs.readFileSync(file, 'utf8')),
    linesCovered: 0,
  }))
}
