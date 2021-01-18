import { foo } from './foo'

describe('bar feature', () => {
  it('tests the foo function again', () => {
    expect(foo(42)).to.equal(84)
  })

  it('another meows', () => {
    expect('meow').to.equal('meow')
  })

  it('this is a function spy', () => {
    const spy = sinon.fake()
    spy()
    expect(spy.callCount).to.equal(1)
  })

  it('bar has an error', () => {
    expect(1).to.equal(2)
  })
})
