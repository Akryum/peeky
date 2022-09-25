import { Session, Profiler } from 'inspector'
import { promisify } from 'util'
import { performance } from 'perf_hooks'
import fs from 'fs-extra'
import * as path from 'pathe'
import { nanoid } from 'nanoid'

export type V8Coverage = ReadonlyArray<Profiler.ScriptCoverage>

export function useCollectCoverage () {
  const session = new Session()
  const postSession = promisify(session.post.bind(session)) as (method: string, params?: any) => Promise<any>

  async function start (): Promise<void> {
    session.connect()

    await postSession('Profiler.enable')

    await postSession('Profiler.startPreciseCoverage', {
      callCount: true,
      detailed: true,
    })
  }

  async function collect (): Promise<V8Coverage> {
    const { result } = await postSession('Profiler.takePreciseCoverage')

    await postSession('Profiler.stopPreciseCoverage')
    await postSession('Profiler.disable')

    const tempFile = path.join(process.cwd(), `node_modules/.temp/coverage/coverage-${nanoid()}.json`)
    await fs.ensureDir(path.dirname(tempFile))
    await fs.writeJson(tempFile, { result, timestamp: performance.now() })

    return result
  }

  return {
    start,
    collect,
  }
}
