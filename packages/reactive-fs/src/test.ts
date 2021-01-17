import { join } from 'path'
import { createReactiveFileSystem } from '.';

(async () => {
  const { files, effect, createFile } = await createReactiveFileSystem({
    baseDir: join(__dirname, '..', 'test'),
    glob: '**/*.js',
  })

  effect(() => {
    console.log('files:', Object.keys(files))
  })

  effect(() => {
    console.log('read:', files['meow.js']?.content)
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
