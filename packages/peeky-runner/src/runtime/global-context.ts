import { Test, TestSuite } from '../types.js'

export let currentSuite: TestSuite
export let currentTest: Test
export let currentTestFile: string

export function setCurrentSuite (suite: TestSuite) {
  currentSuite = suite
}

export function setCurrentTest (test: Test) {
  currentTest = test
}

export function setCurrentTestFile (file: string) {
  currentTestFile = file
}
