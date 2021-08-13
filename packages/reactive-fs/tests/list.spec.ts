import { createReactiveFileSystem, ReactiveFileSystem } from '@peeky/reactive-fs'
import { join } from 'path'

let fs: ReactiveFileSystem

describe('reactive fs: list()', () => {
  beforeEach(async () => {
    fs = await createReactiveFileSystem({
      baseDir: join(__dirname, 'list-example'),
      glob: ['**/*.js'],
      ignored: ['excluded'],
    })
  })

  test('scan for files', () => {
    expect(fs.list().sort()).toEqual(['sub/waf.js', 'meow.js'].sort())
  })

  test('exclude sub directories', () => {
    expect(fs.list('.', { excludeSubDirectories: true }).sort()).toEqual(['meow.js'].sort())
  })

  test('list sub directory', () => {
    expect(fs.list('sub').sort()).toEqual(['sub/waf.js'].sort())
  })

  test('list is reactive', () => {
    let results: string[] = []
    fs.effect(() => {
      results = fs.list('.', { excludeSubDirectories: true }).sort()
    })
    expect(results).toEqual(['meow.js'].sort())
    fs.createFile('foo.js', '')
    expect(results).toEqual(['meow.js', 'foo.js'].sort())
    fs.files['foo.js'].remove()
    expect(results).toEqual(['meow.js'].sort())
  })
})
