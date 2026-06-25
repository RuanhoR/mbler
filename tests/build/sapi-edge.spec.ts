import { describe, it, expect } from 'vitest'
import { evalVersion } from '../../src/build/sapi'

describe('evalVersion edge cases', () => {
  it('handles short version', () => {
    const result = evalVersion('1.0.0-beta')
    expect(result).toBe('1.0.0-beta')
  })
})
