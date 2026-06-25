import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShowText = vi.hoisted(() => vi.fn())
const mockWaitVerify = vi.hoisted(() => vi.fn())
const mockPublish = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  showText: mockShowText,
}))

vi.mock('../../src/publisher/tokenManager', () => ({
  TokenManager: {
    waitVerify: mockWaitVerify,
    isLogin: false,
  },
}))

vi.mock('../../src/publisher/publishManager', () => ({
  PublishManager: {
    publish: mockPublish,
  },
}))

vi.mock('../../src/i18n', () => ({
  default: {
    help: {
      publish: 'publish help',
      lang: 'lang help',
      config: 'config help',
    },
    publish: {
      notLoggedIn: 'Not logged in',
      progress: 'Progress: {progress}%',
      publishFailed: 'Publish failed: {error}',
      publishing: 'Publishing...',
      building: 'Building project...',
      publishToMarket: 'Publishing to marketplace...',
      publishSuccess: 'Publish successful',
      publishResult: '+ {name}@{version} ({tag})',
    },
  },
}))

import { publishCommand } from '../../src/cli/publish'

describe('publishCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fail when not logged in', async () => {
    mockWaitVerify.mockResolvedValue(undefined)
    const TokenManager = (await import('../../src/publisher/tokenManager')).TokenManager
    Object.assign(TokenManager, { isLogin: false })

    const code = await publishCommand.handler({
      args: {},
      opts: { build: 'skip' },
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })

  it('should handle publish error', async () => {
    mockWaitVerify.mockResolvedValue(undefined)
    const TokenManager = (await import('../../src/publisher/tokenManager')).TokenManager
    Object.assign(TokenManager, { isLogin: true })
    mockPublish.mockRejectedValue(new Error('upload failed'))

    const code = await publishCommand.handler({
      args: {},
      opts: { build: 'enable' },
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })
})
