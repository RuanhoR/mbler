import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShowText = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  showText: mockShowText,
}))

vi.mock('../../src/i18n', () => ({
  default: {
    help: {
      lang: 'mbler lang\n- No args: show current language\n- zh or en: set language',
    },
    __internal: {
      class: { currentLang: 'zh' },
      set: vi.fn(),
    },
  },
}))

import { langCommand } from '../../src/cli/lang'

describe('langCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show current language when no arg', async () => {
    const code = await langCommand.handler({
      args: { language: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
    expect(mockShowText).toHaveBeenCalledWith('zh')
  })
})
