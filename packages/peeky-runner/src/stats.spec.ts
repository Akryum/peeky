/// <reference types="@peeky/runner"/>

import { getStats } from './stats'

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
            testErrors: 0,
            otherErrors: [],
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
            testErrors: 0,
            otherErrors: [],
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
            testErrors: 0,
            otherErrors: [],
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
            testErrors: 0,
            otherErrors: [],
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
    expect(stats.suiteCount).to.equal(4)
    expect(stats.errorSuiteCount).to.equal(0)
    expect(stats.testCount).to.equal(6)
    expect(stats.errorTestCount).to.equal(0)
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
            testErrors: 0,
            otherErrors: [],
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
            testErrors: 1,
            otherErrors: [],
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
    expect(stats.suiteCount).to.equal(2)
    expect(stats.errorSuiteCount).to.equal(1)
    expect(stats.testCount).to.equal(3)
    expect(stats.errorTestCount).to.equal(1)
  })
})
