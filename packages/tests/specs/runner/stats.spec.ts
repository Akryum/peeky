import { getStats } from '../../../peeky-runner/src/stats'

describe('getStats()', () => {
  test('no errors', () => {
    const stats = getStats([
      {
        duration: 0,
        filePath: '',
        modules: [],
        suites: [
          {
            id: '',
            filePath: '',
            title: '',
            errors: 0,
            tests: [
              {
                id: '',
                title: '',
                error: null,
              },
            ],
          },
          {
            id: '',
            filePath: '',
            title: '',
            errors: 0,
            tests: [
              {
                id: '',
                title: '',
                error: null,
              },
              {
                id: '',
                title: '',
                error: null,
              },
            ],
          },
        ],
      },
      {
        duration: 0,
        filePath: '',
        modules: [],
        suites: [
          {
            id: '',
            filePath: '',
            title: '',
            errors: 0,
            tests: [
              {
                id: '',
                title: '',
                error: null,
              },
            ],
          },
          {
            id: '',
            filePath: '',
            title: '',
            errors: 0,
            tests: [
              {
                id: '',
                title: '',
                error: null,
              },
              {
                id: '',
                title: '',
                error: null,
              },
            ],
          },
        ],
      },
    ])
    expect(stats.suiteCount).to.eql(4)
    expect(stats.errorSuiteCount).to.eql(0)
    expect(stats.testCount).to.eql(6)
    expect(stats.errorTestCount).to.eql(0)
  })

  test('counts errors', () => {
    const stats = getStats([
      {
        duration: 0,
        filePath: '',
        modules: [],
        suites: [
          {
            id: '',
            filePath: '',
            title: '',
            errors: 0,
            tests: [
              {
                id: '',
                title: '',
                error: null,
              },
            ],
          },
          {
            id: '',
            filePath: '',
            title: '',
            errors: 1,
            tests: [
              {
                id: '',
                title: '',
                error: new Error(),
              },
              {
                id: '',
                title: '',
                error: null,
              },
            ],
          },
        ],
      },
    ])
    expect(stats.suiteCount).to.eql(2)
    expect(stats.errorSuiteCount).to.eql(1)
    expect(stats.testCount).to.eql(3)
    expect(stats.errorTestCount).to.eql(1)
  })
})
