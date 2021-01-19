import esbuild from 'rollup-plugin-esbuild'
import { rollup } from 'rollup'
import fs from 'fs'
import { fs as memfs } from 'memfs'
import { ufs } from 'unionfs'
import { patchFs, patchRequire } from 'fs-monkey'
import { dirname, join, relative } from 'path'
import { workerEmit } from '@akryum/workerpool'
import { Context, EventType } from './types'

const originalFs = { ...fs }
let mockedFs = false

export function mockFileSystem () {
  if (mockedFs) return
  mockedFs = true
  // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
  // @ts-ignore
  ufs.use(originalFs).use(memfs)
  // Patch unionfs to write to memfs only
  Object.assign(ufs, {
    unwatchFile: originalFs.unwatchFile,
    mkdir: memfs.mkdir,
    mkdirSync: memfs.mkdirSync,
    write: memfs.write,
    writeFile: memfs.writeFile,
    writeFileSync: memfs.writeFileSync,
  })
  patchFs(ufs)
  patchRequire(ufs)
}

export async function buildTestFile (ctx: Context) {
  mockFileSystem()

  const targetDir = dirname(ctx.options.entry)

  try {
    // Ensure target directory
    memfs.mkdirSync(targetDir, { recursive: true })

    // Rollup cache
    const cachePath = getCachePath(ctx.options.entry)
    const cache = loadBuildCache(ctx, cachePath)

    workerEmit(EventType.BUILDING, {
      testFilePath: ctx.options.entry,
    })

    const time = Date.now()
    const bundle = await rollup({
      input: ctx.options.entry,
      plugins: [
        esbuild({
          tsconfig: join(process.cwd(), 'tsconfig.json'),
          minify: false,
        }),
      ],
      external: [
        /node_modules/,
      ],
      cache,
    })

    saveBuildCache(ctx, cachePath, bundle.cache)

    await bundle.write({
      dir: join(targetDir, '/__output'),
      entryFileNames: 'target.js',
      format: 'cjs',
      sourcemap: true,
    })

    await bundle.close()

    workerEmit(EventType.BUILD_COMPLETED, {
      testFilePath: ctx.options.entry,
      duration: Date.now() - time,
    })
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
  if (fs.existsSync(cachePath)) {
    try {
      cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'))
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
    originalFs.mkdirSync(dirname(cachePath), {
      recursive: true,
    })
    originalFs.writeFileSync(cachePath, JSON.stringify(cacheData), { encoding: 'utf8' })
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
