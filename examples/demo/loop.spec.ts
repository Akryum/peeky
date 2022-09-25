describe.skip('loop test', () => {
  for (let i = 0; i < 30000; i++) {
    test('test', () => {
      expect(1).toBe(1)
    })
  }
})
