import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShowText = vi.hoisted(() => vi.fn())
const mockInput = vi.hoisted(() => vi.fn())
const mockGetToken = vi.hoisted(() => vi.fn())
const mockSetToken = vi.hoisted(() => vi.fn())
const mockWaitVerify = vi.hoisted(() => vi.fn())
const mockTokenState = vi.hoisted(() => ({ isLogin: false, user: undefined as { name: string } | undefined }))

vi.mock('../../src/utils', () => ({
  showText: mockShowText,
  input: mockInput,
}))

vi.mock('../../src/publisher/tokenManager', () => ({
  TokenManager: {
    getToken: mockGetToken,
    setToken: mockSetToken,
    waitVerify: mockWaitVerify,
    get isLogin() { return mockTokenState.isLogin },
    get user() { return mockTokenState.user },
  },
}))

import { loginCommand } from '../../src/cli/login'

describe('loginCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTokenState.isLogin = false
    mockTokenState.user = undefined
  })

  it('should login with token from args', async () => {
    mockGetToken.mockResolvedValue(undefined)
    mockSetToken.mockResolvedValue(undefined)
    mockWaitVerify.mockResolvedValue(undefined)
    mockTokenState.isLogin = true
    mockTokenState.user = { name: 'testuser' }

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
    mockTokenState.isLogin = true
    mockTokenState.user = { name: 'u' }

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
