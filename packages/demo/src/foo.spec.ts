import { foo, doesntWork } from './foo'

describe('typescript test suite', () => {
  it('tests the foo function', () => {
    expect(foo(42)).toBe(84)
  })

  it('meows', () => {
    expect('meow').toBe('meow')
  })

  it('test a function', () => {
    const spy = sinon.fake()
    spy()
    expect(spy.callCount).toBe(1)
  })

  it('assertion error in the test', () => {
    expect(1).toBe(2)
  })

  it('assertion error with objects', () => {
    expect({
      list: [
        1,
        2,
        3,
        { a: 1, b: 2 },
        5,
        6,
        7,
      ],
      message: 'hello',
    }).toEqual({
      list: [
        2,
        3,
        { a: 1, b: 3 },
        5,
        9,
        7,
      ],
      message: 'hello!',
    })
  })

  it('the tested code crashes', () => {
    doesntWork()
  })

  it('wait for async op', async () => {
    await wait(1000)
    expect(0).toBe(0)
  })

  it('wait for async op 2', async () => {
    await wait(1000)
    expect(0).toBe(0)
  })

  it('wait for async op 3', async () => {
    await wait(1000)
    expect(0).toBe(0)
    // doesntWork()
  })
})

function wait (delay: number) {
  return new Promise(resolve => {
    setTimeout(resolve, delay)
  })
}
