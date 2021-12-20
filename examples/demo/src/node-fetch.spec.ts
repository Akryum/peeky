/* @peeky {
  runtimeEnv: 'dom'
} */

import fetch from 'node-fetch'

test('node-fetch', async () => {
  expect(typeof fetch).toBe('function')

  const result = await fetch('https://google.com')
  const text = await result.text()
  expect(typeof text).toBe('string')
  expect(text.length).toBeGreaterThan(0)
})
