import { Test, TestSuite } from '../types.js'

export let currentSuite: TestSuite
export let currentTest: Test

export function setCurrentSuite (suite: TestSuite) {
  currentSuite = suite
}

export function setCurrentTest (test: Test) {
  currentTest = test
}
