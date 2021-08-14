describe('mock module', () => {
  test('mock a module during the test', async () => {
    peeky.mockModule('./foo.js', {
      foo (count) {
        return count + 1
      },
    })
    import('./foo')

    const { bar } = await import('./bar')

    expect(bar(42)).toBe(43)
  })
})
