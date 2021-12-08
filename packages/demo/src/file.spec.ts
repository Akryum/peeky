/* @peeky {
  mockFs: true,
} */

import fs from 'fs'
import path from 'path'

describe('file system', () => {
  test('write a file', () => {
    const file = path.resolve(__dirname, './test.txt')
    fs.writeFileSync(file, 'Hello World', 'utf8')
    const contents = fs.readFileSync(file, 'utf8')
    expect(contents).toBe('Hello World')
  })
})
