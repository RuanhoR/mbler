import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShowText = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  showText: mockShowText,
}))

vi.mock('../../src/i18n', () => ({
  default: {
    publish: { notLoggedIn: 'Not logged in' },
    profile: {
      user: 'User: {name}',
      uid: 'UID: {uid}',
      mail: 'Mail: {mail}',
      created: 'Created: {created}',
      avatarUrl: 'Avatar URL: {url}',
      failed: 'Profile failed: {error}',
    },
  },
}))

import { profileCommand } from '../../src/cli/profile'

describe('profileCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show profile when logged in', async () => {
    const mockWaitVerify = vi.fn().mockResolvedValue(undefined)

    vi.doMock('../../src/publisher/tokenManager', () => ({
      TokenManager: {
        waitVerify: mockWaitVerify,
        isLogin: true,
        isLoading: false,
        user: {
          name: 'testuser',
          uid: 123,
          mail: 'test@example.com',
          ctime: '2024-01-01',
        },
      },
    }))

    const { profileCommand } = await import('../../src/cli/profile')
    const code = await profileCommand.handler({
      args: {},
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
  })
})
