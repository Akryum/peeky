import { Reporter } from '../types.js'

export function createRawReporter (write: (data: Record<string, any>) => unknown): Reporter {
  return {
    log: ({ type, text, suite, test }) => {
      write({
        __type: 'log',
        type,
        text,
        suiteId: suite?.id,
        testId: test?.id,
      })
    },

    suiteStart: (payload) => {
      write(payload)
    },

    suiteComplete: (payload) => {
      write({
        __type: 'suiteComplete',
        suiteId: payload.suite.id,
        duration: payload.suite.duration,
        testErrors: payload.suite.testErrors,
        otherErrors: payload.suite.otherErrors,
      })
    },

    testFail: (payload) => {
      write({
        ___type: 'testFail',
        suiteId: payload.suite.id,
        testId: payload.test.id,
        duration: payload.test.duration,
        error: payload.test.error,
      })
    },

    summary: (payload) => {
      write({
        __type: 'summary',
        ...payload,
      })
    },
  }
}
