import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShowText = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  showText: mockShowText,
}))

vi.mock('../../src/i18n', () => ({
  default: {
    help: {
      view: 'view help',
      lang: 'lang help',
      config: 'config help',
    },
    view: {
      usage: 'mbler view @<scope>/<name>',
      packageNotFound: 'Package {pkg} not found',
      title: 'Package {pkg} versions:',
      versionLine: '- {version} [{tag}] by {user} at {time}',
      failed: 'View failed: {error}',
    },
  },
}))

vi.mock('../../src/publisher/installManager', () => ({
  InstallManager: {
    info: vi.fn(),
  },
}))

import { viewCommand } from '../../src/cli/view'

describe('viewCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject invalid package format', async () => {
    const code = await viewCommand.handler({
      args: { package: 'invalid-format' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
    expect(mockShowText).toHaveBeenCalledWith('mbler view @<scope>/<name>')
  })

  it('should handle error from InstallManager', async () => {
    const { InstallManager } = await import('../../src/publisher/installManager')
    vi.mocked(InstallManager.info).mockRejectedValue(new Error('network error'))

    const code = await viewCommand.handler({
      args: { package: '@scope/name' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })
})
