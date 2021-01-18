import babel from '@rollup/plugin-babel'
import typescript from '@rollup/plugin-typescript'
import { rollup } from 'rollup'
import fs from 'fs'
import { fs as memfs } from 'memfs'
import { ufs } from 'unionfs'
import { patchFs, patchRequire } from 'fs-monkey'
import sinon from 'sinon'
import must from 'must'
import { install as installSourceMap } from 'source-map-support'
import { dirname, join } from 'path'

interface RunTestFileOptions {
  entry: string
}

interface Context {
  options: RunTestFileOptions
  suites: TestSuite[]
}

interface TestSuite {
  title: string
  beforeAllHandlers: (() => unknown)[]
  beforeEachHandlers: (() => unknown)[]
  afterAllHandlers: (() => unknown)[]
  afterEachHandlers: (() => unknown)[]
  tests: Test[]
  errors: number
}

interface Test {
  title: string
  handler: () => unknown
  error: Error
}

async function build (ctx: Context) {
  const originalFs = { ...fs }
  // @ts-ignore
  ufs.use(memfs).use(originalFs)
  ufs.unwatchFile = originalFs.unwatchFile
  patchFs(ufs)
  patchRequire(ufs)

  try {
    const time = Date.now()
    const bundle = await rollup({
      input: ctx.options.entry,
      plugins: [
        typescript({
          tsconfig: join(process.cwd(), 'tsconfig.json'),
          module: 'ESNext',
        }),
        babel({
          babelHelpers: 'bundled',
        }),
      ],
      external: [
        /node_modules/,
      ],
    })

    await bundle.write({
      dir: join(dirname(ctx.options.entry), '/__output'),
      entryFileNames: 'target.js',
      format: 'cjs',
      sourcemap: true,
    })

    await bundle.close()
    console.log(`Built in ${Date.now() - time}ms`)
  } catch (e) {
    console.error(`Test build failed: ${e.message}`)
    throw e
  }
}

function registerGlobals (ctx: Context) {
  (global as any).expect = must
  ;(global as any).sinon = sinon

  let currentSuite: TestSuite

  (global as any).describe = (title: string, handler: () => unknown) => {
    currentSuite = {
      title,
      tests: [],
      beforeAllHandlers: [],
      beforeEachHandlers: [],
      afterAllHandlers: [],
      afterEachHandlers: [],
      errors: 0,
    }
    ctx.suites.push(currentSuite)
    handler()
  }

  (global as any).it = (global as any).test = (title: string, handler: () => unknown) => {
    currentSuite.tests.push({
      title,
      handler,
      error: null,
    })
  }

  (global as any).beforeAll = (handler: () => unknown) => {
    currentSuite.beforeAllHandlers.push(handler)
  }

  (global as any).afterAll = (handler: () => unknown) => {
    currentSuite.afterAllHandlers.push(handler)
  }

  (global as any).beforeEach = (handler: () => unknown) => {
    currentSuite.beforeEachHandlers.push(handler)
  }

  (global as any).afterEach = (handler: () => unknown) => {
    currentSuite.afterEachHandlers.push(handler)
  }
}

async function runTests (ctx: Context) {
  for (const suite of ctx.suites) {
    console.log(suite.title)
    const suiteTime = Date.now()
    for (const handler of suite.beforeAllHandlers) {
      await handler()
    }

    for (const test of suite.tests) {
      sinon.restore()

      for (const handler of suite.beforeEachHandlers) {
        await handler()
      }

      const time = Date.now()
      try {
        await test.handler()
        console.log(`  ✔️ ${test.title} ${Date.now() - time}ms`)
      } catch (e) {
        test.error = e
        console.error(`  ❌️${test.title} ${Date.now() - time}ms Failed:\n${e.stack}`)
        suite.errors++
      }

      for (const handler of suite.afterEachHandlers) {
        await handler()
      }
    }

    for (const handler of suite.afterAllHandlers) {
      await handler()
    }

    console.log(`${suite.tests.length - suite.errors} / ${suite.tests.length} tests passed ${Date.now() - suiteTime}ms`)
  }
}

export async function runTestFile (options: RunTestFileOptions) {
  try {
    const ctx: Context = {
      options,
      suites: [],
    }
    await build(ctx)
    registerGlobals(ctx)
    installSourceMap()
    require(join(dirname(ctx.options.entry), '/__output/target.js'))
    await runTests(ctx)
  } catch (e) {
    console.error(`Running tests failed: ${e.stack}`)
    throw e
  }
}
