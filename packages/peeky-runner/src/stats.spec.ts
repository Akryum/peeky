import { getStats } from './stats'

describe('getStats()', () => {
  test('no errors', () => {
    const stats = getStats([
      {
        duration: 0,
        filePath: '',
        deps: [],
        coverage: [],
        suites: [
          {
            id: '',
            filePath: '',
            title: '',
            allTitles: [],
            testErrors: 0,
            otherErrors: [],
            children: [
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: null,
              }],
            ],
            runTestCount: 1,
          },
          {
            id: '',
            filePath: '',
            title: '',
            allTitles: [],
            testErrors: 0,
            otherErrors: [],
            children: [
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: null,
              }],
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: null,
              }],
            ],
            runTestCount: 2,
          },
        ],
        failedSnapshots: [],
        newSnapshots: [],
        passedSnapshots: [],
      },
      {
        duration: 0,
        filePath: '',
        deps: [],
        coverage: [],
        suites: [
          {
            id: '',
            filePath: '',
            title: '',
            allTitles: [],
            testErrors: 0,
            otherErrors: [],
            children: [
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: null,
              }],
            ],
            runTestCount: 1,
          },
          {
            id: '',
            filePath: '',
            title: '',
            allTitles: [],
            testErrors: 0,
            otherErrors: [],
            children: [
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: null,
              }],
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: null,
              }],
            ],
            runTestCount: 2,
          },
        ],
        failedSnapshots: [],
        newSnapshots: [],
        passedSnapshots: [],
      },
    ])
    expect(stats.suiteCount).toBe(4)
    expect(stats.errorSuiteCount).toBe(0)
    expect(stats.testCount).toBe(6)
    expect(stats.errorTestCount).toBe(0)
  })

  test('counts errors', () => {
    const stats = getStats([
      {
        duration: 0,
        filePath: '',
        deps: [],
        coverage: [],
        suites: [
          {
            id: '',
            filePath: '',
            title: '',
            allTitles: [],
            testErrors: 0,
            otherErrors: [],
            children: [
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: null,
              }],
            ],
            runTestCount: 1,
          },
          {
            id: '',
            filePath: '',
            title: '',
            allTitles: [],
            testErrors: 1,
            otherErrors: [],
            children: [
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: new Error(),
              }],
              ['test', {
                id: '',
                title: '',
                flag: null,
                error: null,
              }],
            ],
            runTestCount: 2,
          },
        ],
        failedSnapshots: [],
        newSnapshots: [],
        passedSnapshots: [],
      },
    ])
    expect(stats.suiteCount).toBe(2)
    expect(stats.errorSuiteCount).toBe(1)
    expect(stats.testCount).toBe(3)
    expect(stats.errorTestCount).toBe(1)
  })
})
