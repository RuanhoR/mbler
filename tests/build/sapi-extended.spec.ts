import { describe, it, expect } from 'vitest'
import { evalVersion } from '../../src/build/sapi'

describe('evalVersion', () => {
  it('should extract major version from beta version', () => {
    expect(evalVersion('1.0.0-beta.1.21.100-stable')).toBe('1.0.0-beta')
  })

  it('should extract from formal version', () => {
    expect(evalVersion('2.0.0-stable')).toBe('2.0.0-stable')
  })

  it('should handle version with multiple segments', () => {
    expect(evalVersion('1.0.0-rc.1')).toBe('1.0.0-rc')
  })
})
