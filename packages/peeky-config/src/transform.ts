import { transformWithEsbuild } from '@peeky/utils'

export async function transformConfigCode (code: string, fileName: string) {
  return transformWithEsbuild(code, fileName, {
    target: [`node${process.versions.node}`],
    format: 'esm',
  })
}
