import esbuild from '@akryum/rollup-plugin-esbuild'
import { rollup } from 'rollup'
import { dirname, join, relative } from 'path'
import { workerEmit } from '@akryum/workerpool'
import { Context, EventType } from './types'
import shortid from 'shortid'
import { fs, realFs } from './fs'
import { ensureESBuildService } from '@peeky/utils'

export async function buildTestFile (ctx: Context) {
  const targetDir = dirname(ctx.options.entry)

  try {
    // Ensure target directory
    fs.mkdirSync(targetDir, { recursive: true })

    // Rollup cache
    const cachePath = getCachePath(ctx.options.entry)
    const cache = loadBuildCache(ctx, cachePath)

    workerEmit(EventType.BUILDING, {
      testFilePath: ctx.options.entry,
    })

    const outputFile = `test-${shortid()}.js`
    const outputPath = join(targetDir, outputFile)

    const time = Date.now()
    const esbuildService = await ensureESBuildService()
    const bundle = await rollup({
      input: ctx.options.entry,
      plugins: [
        esbuild({
          service: esbuildService,
          tsconfig: join(process.cwd(), 'tsconfig.json'),
          minify: false,
        }),
      ],
      external: [
        /node_modules/,
      ],
      cache,
    })

    const rollupOutput = await bundle.write({
      dir: targetDir,
      entryFileNames: outputFile,
      format: 'cjs',
      sourcemap: true,
      chunkFileNames: '[name].js',
      assetFileNames: '[name].[ext]',
    })
    const modules = Object.keys(rollupOutput.output[0].modules)

    saveBuildCache(ctx, cachePath, bundle.cache)
    await bundle.close()

    workerEmit(EventType.BUILD_COMPLETED, {
      testFilePath: ctx.options.entry,
      modules,
      duration: Date.now() - time,
    })

    return {
      outputPath,
      modules,
    }
  } catch (e) {
    workerEmit(EventType.BUILD_FAILED, {
      testFilePath: ctx.options.entry,
      error: e,
    })
    throw e
  }
}

export function getCachePath (filePath: string) {
  const cacheKey = relative(process.cwd(), filePath).replace(/(\/|\.)/g, '_')
  return join(process.cwd(), 'node_modules', '.temp', 'peeky-build-cache', cacheKey + '.json')
}

export function loadBuildCache (ctx: Context, cachePath: string) {
  let cache
  if (realFs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(realFs.readFileSync(cachePath, 'utf8'))
    } catch (e) {
      workerEmit(EventType.CACHE_LOAD_FAILED, {
        filePath: ctx.options.entry,
        error: e,
        cachePath,
      })
    }
  }
  return cache
}

export function saveBuildCache (ctx: Context, cachePath: string, cacheData: any) {
  try {
    realFs.mkdirSync(dirname(cachePath), {
      recursive: true,
    })
    realFs.writeFileSync(cachePath, JSON.stringify(cacheData), { encoding: 'utf8' })
    workerEmit(EventType.CACHE_SAVE_SUCCESS, {
      filePath: ctx.options.entry,
      cachePath,
    })
  } catch (e) {
    workerEmit(EventType.CACHE_SAVE_FAILED, {
      filePath: ctx.options.entry,
      error: e,
      cachePath,
    })
  }
}
