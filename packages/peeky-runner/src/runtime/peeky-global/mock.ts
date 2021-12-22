import { resolve, dirname } from 'pathe'
import { mockedModules } from '../mocked-files.js'
import { PeekyGlobalContext } from './index.js'

export function createMockModule (ctx: PeekyGlobalContext) {
  return (path: string, stub: any) => {
    mockedModules.set(resolve(dirname(ctx.filename), path), stub)
  }
}
