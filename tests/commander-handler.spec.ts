import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/i18n', () => ({
  default: {
    commander: { selectTip: 'tip' },
    help: {
      help: 'help text',
      lang: 'lang help',
    },
  },
}))

vi.mock('../../src/version', () => ({
  default: { commit: 'abc', version: '1.0.0' },
}))

describe('Commander handler', () => {
  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  it('should import commander module', async () => {
    const mod = await import('../../src/commander/index')
    expect(mod.Input).toBeDefined()
    expect(mod.click).toBeDefined()
    expect(mod.onEnd).toBeDefined()
  })

  it('should handle onEnd registration', async () => {
    const mod = await import('../../src/commander/index')
    const task = vi.fn()
    mod.onEnd(task)
    expect(task).not.toHaveBeenCalled()
  })
})
