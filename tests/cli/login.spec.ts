import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShowText = vi.hoisted(() => vi.fn())
const mockInput = vi.hoisted(() => vi.fn())
const mockGetToken = vi.hoisted(() => vi.fn())
const mockSetToken = vi.hoisted(() => vi.fn())
const mockWaitVerify = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  showText: mockShowText,
  input: mockInput,
}))

vi.mock('../../src/publisher/tokenManager', () => ({
  TokenManager: {
    getToken: mockGetToken,
    setToken: mockSetToken,
    waitVerify: mockWaitVerify,
  },
}))

import { loginCommand } from '../../src/cli/login'

describe('loginCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should login with token from args', async () => {
    mockGetToken.mockResolvedValue(undefined)
    mockSetToken.mockResolvedValue(undefined)
    mockWaitVerify.mockResolvedValue(undefined)
    const TokenManager = (await vi.importMock('../../src/publisher/tokenManager')).TokenManager
    Object.assign(TokenManager, { isLogin: true, user: { name: 'testuser' } })

    const code = await loginCommand.handler({
      args: { token: 'valid-token' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
  })

  it('should prompt for token when not provided', async () => {
    mockInput.mockResolvedValue('prompted-token')
    mockGetToken.mockResolvedValue(undefined)
    mockSetToken.mockResolvedValue(undefined)
    mockWaitVerify.mockResolvedValue(undefined)
    const TokenManager = (await vi.importMock('../../src/publisher/tokenManager')).TokenManager
    Object.assign(TokenManager, { isLogin: true, user: { name: 'u' } })

    const code = await loginCommand.handler({
      args: { token: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
  })

  it('should fail when token is empty after prompt', async () => {
    mockInput.mockResolvedValue('')

    const code = await loginCommand.handler({
      args: { token: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })
})
