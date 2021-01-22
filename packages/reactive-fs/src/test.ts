import { join } from 'path'
import { createReactiveFileSystem } from '.';

(async () => {
  const {
    files,
    effect,
    createFile,
    watchFile,
    list,
    watchList,
    watch,
  } = await createReactiveFileSystem({
    baseDir: join(__dirname, '..', 'test'),
    glob: '**/*.js',
  })

  console.log('list without sub folders:', list('.', {
    excludeSubDirectories: true,
  }))

  effect(() => {
    console.log('files:', list())
  })

  effect(() => {
    console.log('files in sub folder:', list('./sub'))
  })

  watchList('./', (result, oldResult) => {
    console.log('watch folder:', result, oldResult)
  }, {
    excludeSubDirectories: true,
  })

  effect(() => {
    console.log('read:', files['meow.js']?.content)
  })

  watchFile('foo.js', (content, oldContent) => {
    console.log('foo.js watch:', content, oldContent)
  })

  effect(async () => {
    console.log('await read:', await files['meow.js']?.waitForContent)
    console.log('await read2:', await files['cat.js']?.waitForContent)
  })

  // Async
  watch(() => ({
    meow: files['meow.js']?.content,
    cat: files['cat.js']?.content,
  }), async (content) => {
    await Promise.resolve()
    console.log('async watch effect:', content)
  })

  setTimeout(() => {
    console.log('writting...')
    files['meow.js'].content = 'console.log(\'meow\')\n'
    files['foo.js'].move('barr.js')
  }, 1000)

  setTimeout(() => {
    console.log('writting...')
    files['meow.js'].content = 'console.log(\'waf\')\n'
    files['barr.js'].move('foo.js')
  }, 2000)

  setTimeout(() => {
    console.log('create cat.js...')
    createFile('cat.js', 'const cat = "waf"')
  }, 3000)

  setTimeout(() => {
    console.log('remove cat.js...')
    files['cat.js'].remove()
  }, 4000)
})()
