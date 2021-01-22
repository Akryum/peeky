import { retry } from '../../../../peeky-runner/src/peeky-global/test-flow'

describe('peeky.retry()', () => {
  test('must not retry when no error', async () => {
    const spy = sinon.fake()
    expect(spy.callCount).to.eql(0)
    await retry(() => spy(), 10)
    expect(spy.callCount).to.eql(1)
  })

  test('retry multiple times', async () => {
    let times = 0
    const spy = sinon.fake(() => {
      times++
      if (times < 4) {
        throw new Error('Not enough times')
      }
    })
    expect(spy.callCount).to.eql(0)
    await retry(() => spy(), 5)
    expect(spy.callCount).to.eql(4)
  })

  test('retry multiple times and bail out', async () => {
    const spy = sinon.fake(() => {
      throw new Error('Not enough times')
    })
    expect(spy.callCount).to.eql(0)
    let error: Error
    try {
      await retry(() => spy(), 5)
    } catch (e) {
      error = e
    }
    expect(spy.callCount).to.eql(5)
    expect(error).not.to.be.undefined()
  })
})
