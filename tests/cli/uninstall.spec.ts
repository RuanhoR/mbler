import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShowText = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  showText: mockShowText,
}))

const mockGetKey = vi.hoisted(() => vi.fn())
const mockSetKey = vi.hoisted(() => vi.fn())

vi.mock('../../src/publisher/configManager', () => ({
  ConfigManager: {
    getKey: mockGetKey,
    setKey: mockSetKey,
  },
}))

vi.mock('../../src/publisher/GamePath', () => ({
  GamePath: {
    getPathWithASK: vi.fn().mockResolvedValue('/games/minecraft'),
  },
}))

vi.mock('../../src/i18n', () => ({
  default: {
    help: {
      uninstall: 'uninstall help',
      lang: 'lang help',
      config: 'config help',
    },
    uninstall: {
      success: 'Package {pkg}@{version} uninstalled successfully',
      failed: 'Uninstall failed: {error}',
    },
  },
}))

import { uninstallCommand } from '../../src/cli/uninstall'

describe('uninstallCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should reject invalid package format', async () => {
    const code = await uninstallCommand.handler({
      args: { package: 'invalid' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })
})
