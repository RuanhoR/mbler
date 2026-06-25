import { describe, it, expect, vi } from 'vitest'

import { Input } from '../src/commander'

describe('Commander - full', () => {
  describe('Input.select', () => {
    it('should return a promise', () => {
      const promise = Input.select('test', ['a', 'b'])
      expect(promise).toBeInstanceOf(Promise)
    })
  })
})
