describe('only', () => {
  test('a', () => {
    expect(1).toEqual(1)
  })

  test.only('b', () => {
    expect(1).toEqual(1)
  })

  test('c', () => {
    expect(1).toEqual(1)
  })
})

describe('skip', () => {
  test('a', () => {
    expect(1).toEqual(1)
  })

  test.skip('b', () => {
    expect(1).toEqual(1)
  })

  test.skip('c', () => {
    expect(1).toEqual(1)
  })
})

describe('todo', () => {
  test('a', () => {
    expect(1).toEqual(1)
  })

  test.todo('b', () => {
    expect(1).toEqual(1)
  })

  test.todo('c')
})

describe('mix and match', () => {
  test('a', () => {
    expect(1).toEqual(1)
  })

  test.todo('b', () => {
    expect(1).toEqual(1)
  })

  test.skip('c')
})
