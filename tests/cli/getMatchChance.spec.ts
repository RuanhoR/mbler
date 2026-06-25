import { describe, it, expect } from 'vitest'

function getMatchChance(a: string, b: string): number {
  let match = 0
  for (let i = 0; i < b.length; i++) {
    if (a[i] == b[i]) match++
  }
  return match / b.length
}

describe('getMatchChance', () => {
  it('returns 1 for exact match', () => {
    expect(getMatchChance('build', 'build')).toBe(1)
  })

  it('returns 0 for no match', () => {
    expect(getMatchChance('abc', 'xyz')).toBe(0)
  })

  it('handles empty input', () => {
    expect(getMatchChance('', 'test')).toBe(0)
  })

  it('handles shorter a', () => {
    expect(getMatchChance('ab', 'abc')).toBeCloseTo(0.667, 2)
  })
})
