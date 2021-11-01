/// <reference types="@peeky/runner"/>

import { answer } from './js-module'

describe('hello from vanilla js', () => {
  it('works', () => {
    expect(1).toBe(1)
  })

  it('import js file', () => {
    expect(answer).toBe(42)
  })
})
