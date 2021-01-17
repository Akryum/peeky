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
  } = await createReactiveFileSystem({
    baseDir: join(__dirname, '..', 'test'),
    glob: '**/*.js',
  })

  effect(() => {
    console.log('files:', list())
  })

  effect(() => {
    console.log('files in sub folder:', list('./sub'))
  })

  watchList('./', (result, oldResult) => {
    console.log('watch folder:', result, oldResult)
  })

  effect(() => {
    console.log('read:', files['meow.js']?.content)
  })

  watchFile('foo.js', (content, oldContent) => {
    console.log('foo.js watch:', content, oldContent)
  })

  setTimeout(() => {
    console.log('writting...')
    files['meow.js'].content = 'console.log(\'meow\')\n'
    files['foo.js'].move('barr.js')
    createFile('cat.js', 'const cat = "waf"')
  }, 1000)

  setTimeout(() => {
    console.log('writting...')
    files['meow.js'].content = 'console.log(\'waf\')\n'
    files['barr.js'].move('foo.js')
    files['cat.js'].remove()
  }, 2000)
})()
