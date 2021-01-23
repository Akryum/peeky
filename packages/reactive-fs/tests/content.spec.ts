import { createReactiveFileSystem, ReactiveFileSystem } from '@peeky/reactive-fs'
import { join } from 'path'

let fs: ReactiveFileSystem

describe('reactive fs: file content', () => {
  beforeEach(async () => {
    fs = await createReactiveFileSystem({
      baseDir: join(__dirname, 'content-example'),
      glob: ['**/*.js'],
    })
  })

  test('initial content is undefined', () => {
    expect(fs.files['meow.js'].content).to.be.undefined()
  })

  test('waitForContent', async () => {
    expect(await fs.files['meow.js'].waitForContent).to.eql('console.log(\'meow\')\n')
  })

  test('reactive content (initial load)', async () => {
    let result: string
    fs.effect(() => {
      result = fs.files['meow.js'].content
    })
    expect(result).to.be.undefined()
    await peeky.retry(() => expect(result).to.eql('console.log(\'meow\')\n'))
  })

  test('reactive content', async () => {
    await fs.files['meow.js'].waitForContent
    let result: string
    fs.effect(() => {
      result = fs.files['meow.js'].content
    })
    expect(result).to.eql('console.log(\'meow\')\n')
    fs.files['meow.js'].content = 'waf'
    await peeky.retry(() => expect(result).to.eql('waf'))
  })
})
