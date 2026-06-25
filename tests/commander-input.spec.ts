import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

vi.mock('../../src/version', () => ({
  default: { commit: 'abc', version: '1.0.0' },
}))

vi.mock('../../src/i18n', () => ({
  default: {
    commander: { selectTip: 'tip' },
    help: {
      help: 'help text',
      lang: 'lang help',
    },
  },
}))

import { Input } from '../../src/commander'

describe('Commander - Input.use', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register and invoke task for normal keys', () => {
    const task = vi.fn()
    Input.use(task)

    const stdin = process.stdin
    stdin.emit('keypress', 'n', { name: 'n', ctrl: false, alt: false })
    expect(task).toHaveBeenCalled()
  })
})
