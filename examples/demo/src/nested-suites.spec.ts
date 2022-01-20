let count = 0

beforeEach(() => {
  count++
})

describe.skip('skipped suite', () => {
  it('skipped test', () => {
    // Skipped
  })
})

describe.todo('todo suite')

describe('nested suite', () => {
  it('skipped test', () => {
    // Skipped
  })

  describe.only('only suite', () => {
    it('test 1', () => {
      expect(count).toBe(1)
    })

    describe('even more nesting', () => {
      beforeEach(() => {
        count++
      })

      it.only('test 2', () => {
        expect(count).toBe(3)
      })

      describe('skipped suite', () => {
        it('skipped test', () => {
          // Skipped
        })
      })
    })

    it('test 3', () => {
      expect(count).toBe(4)
    })
  })
})

it('should count correctly', () => {
  expect(count).toBe(5)
})
