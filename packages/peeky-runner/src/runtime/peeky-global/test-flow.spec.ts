import { createRetry } from './test-flow'

const retry = createRetry({ filename: 'foo.ts' })

describe('peeky.retry()', () => {
  test('must not retry when no error', async () => {
    const spy = sinon.fake()
    expect(spy.callCount).toBe(0)
    await retry(() => spy(), 10)
    expect(spy.callCount).toBe(1)
  })

  test('retry multiple times', async () => {
    let times = 0
    const spy = sinon.fake(() => {
      times++
      if (times < 4) {
        throw new Error('Not enough times')
      }
    })
    expect(spy.callCount).toBe(0)
    await retry(() => spy(), 5)
    expect(spy.callCount).toBe(4)
  })

  test('retry multiple times and bail out', async () => {
    const spy = sinon.fake(() => {
      throw new Error('Not enough times')
    })
    expect(spy.callCount).toBe(0)
    let error: Error
    try {
      await retry(() => spy(), 5)
    } catch (e) {
      error = e
    }
    expect(spy.callCount).toBe(5)
    expect(error).not.toBeUndefined()
  })
})
