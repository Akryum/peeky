import { bar } from './bar'

describe('yet another ts test suite', () => {
  it('tests the bar function again', () => {
    expect(bar(42)).toBe(84)
  })

  it('another meows', () => {
    expect('meow').toBe('meow')
  })

  it('this is a function spy', () => {
    const spy = sinon.fake()
    spy()
    expect(spy.callCount).toBe(1)
  })
})
