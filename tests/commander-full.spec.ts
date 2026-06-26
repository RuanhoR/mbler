import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { Input } from '../src/commander'
describe('Commander - full', () => {
  describe('Input.select', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {})
    })
    afterEach(() => {
      vi.restoreAllMocks()
    })
    it('should return a promise', () => {
      const promise = Input.select('test', ['a', 'b'])
      expect(promise).toBeInstanceOf(Promise)
    })
  })
})
