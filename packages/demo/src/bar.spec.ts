import { foo } from './foo'

describe('this is a test suite :)', () => {
  it('tests the foo function', () => {
    expect(foo(42)).to.equal(84)
  })

  it('meows', () => {
    expect('meow').to.equal('meow')
  })

  it('test a function', () => {
    const spy = sinon.fake()
    spy()
    expect(spy.callCount).to.equal(1)
  })

  it('error', () => {
    expect(1).to.equal(2)
  })
})
