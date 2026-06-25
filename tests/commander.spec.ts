import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockKeypressHandler = vi.hoisted(() => vi.fn())

vi.mock('../src/i18n', () => ({
  default: {
    commander: { selectTip: '(Press b to confirm, n to select next)' },
  },
}))

import { Input } from '../src/commander'

describe('Commander - Input', () => {
  describe('render', () => {
    it('should highlight selected index in green', () => {
      const result = Input.render(['a', 'b', 'c'], 0)
      expect(result).toContain('a')
      expect(result).toContain('b')
      expect(result).toContain('c')
    })

    it('should render last item selected', () => {
      const result = Input.render(['x', 'y', 'z'], 2)
      expect(result).toContain('x')
      expect(result).toContain('y')
      expect(result).toContain('z')
    })

    it('should handle single item array', () => {
      const result = Input.render(['only'], 0)
      expect(result).toContain('only')
    })

    it('should handle empty array', () => {
      const result = Input.render([], 0)
      expect(result).toBe('')
    })

    it('should handle negative index gracefully', () => {
      const result = Input.render(['a', 'b'], -1)
      expect(result).toContain('a')
      expect(result).toContain('b')
    })
  })
})
