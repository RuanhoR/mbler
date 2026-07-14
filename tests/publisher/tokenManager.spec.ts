import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

const mockSetKey = vi.hoisted(() => vi.fn())
const mockGetKey = vi.hoisted(() => vi.fn())

vi.mock('../../src/publisher/configManager', () => ({
  ConfigManager: {
    setKey: mockSetKey,
    getKey: mockGetKey,
    getRegistry: vi.fn().mockResolvedValue('https://d.pmnx.qzz.io'),
  },
}))

vi.mock('../../src/config', () => ({
  default: {
    defaultPmnxBASE: 'https://d.pmnx.qzz.io',
  },
}))

import { TokenManager } from '../../src/publisher/tokenManager'

function resetState() {
  const t = TokenManager as unknown as Record<string, unknown>
  t.memoryToken = null
  t.isLogin = false
  t.isLoading = true
  t.user = null
  t.task = undefined
}

describe('TokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  describe('setToken', () => {
    it('should store token and verify it', async () => {
      mockSetKey.mockResolvedValue(true)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            data: { name: 'testuser', uid: 1, mail: 'a@b.com', ctime: 'now' },
          }),
      })

      await TokenManager.setToken('valid-token')
      expect(TokenManager.memoryToken).toBe('valid-token')
      expect(mockSetKey).toHaveBeenCalledWith('token', 'valid-token')
      expect(TokenManager.isLogin).toBe(true)
      expect(TokenManager.user).toEqual({
        name: 'testuser',
        uid: 1,
        mail: 'a@b.com',
        ctime: 'now',
      })
    })

    it('should throw if config save fails', async () => {
      mockSetKey.mockResolvedValue(false)

      await expect(TokenManager.setToken('token')).rejects.toThrow(
        'Failed to store token'
      )
    })

    it('should trim whitespace from token', async () => {
      mockSetKey.mockResolvedValue(true)
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            data: { name: 'u', uid: 1, mail: 'a@b.com', ctime: 'now' },
          }),
      })

      await TokenManager.setToken('  spaced-token  ')
      expect(TokenManager.memoryToken).toBe('spaced-token')
    })
  })

  describe('requestAPI', () => {
    it('should set isLogin true on successful verification', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            data: { name: 'user', uid: 1, mail: 'a@b.com', ctime: 'now' },
          }),
      })

      await TokenManager.requestAPI('valid-token')
      expect(TokenManager.isLogin).toBe(true)
      expect(TokenManager.isLoading).toBe(false)
      expect(TokenManager.user?.name).toBe('user')
    })

    it('should set isLogin false on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 400 }),
      })

      await TokenManager.requestAPI('bad-token')
      expect(TokenManager.isLogin).toBe(false)
      expect(TokenManager.isLoading).toBe(false)
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await TokenManager.requestAPI('some-token')
      expect(TokenManager.isLogin).toBe(false)
      expect(TokenManager.isLoading).toBe(false)
    })

    it('should skip when no token provided', async () => {
      await TokenManager.requestAPI()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(TokenManager.isLoading).toBe(false)
    })
  })

  describe('getToken', () => {
    it('should return token from config', async () => {
      mockGetKey.mockResolvedValue('stored-token')

      const token = await TokenManager.getToken()
      expect(token).toBe('stored-token')
      expect(mockGetKey).toHaveBeenCalledWith('token')
    })

    it('should return undefined when no token', async () => {
      mockGetKey.mockResolvedValue(undefined)

      const token = await TokenManager.getToken()
      expect(token).toBeUndefined()
    })
  })

  describe('init', () => {
    it('should verify token from memory', async () => {
      TokenManager.memoryToken = 'mem-token'
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            data: { name: 'u', uid: 1, mail: 'a@b.com', ctime: 'now' },
          }),
      })

      await TokenManager.init()
      expect(TokenManager.isLogin).toBe(true)
    })

    it('should verify token from config when no memory token', async () => {
      mockGetKey.mockResolvedValue('config-token')
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            data: {
              name: 'u',
              uid: 1,
              mail: 'a@b.com',
              ctime: 'now',
            },
          }),
      })

      await TokenManager.init()
      expect(mockGetKey).toHaveBeenCalledWith('token')
    })

    it('should set loading false when no token found', async () => {
      mockGetKey.mockResolvedValue(undefined)

      await TokenManager.init()
      expect(TokenManager.isLoading).toBe(false)
      expect(TokenManager.isLogin).toBe(false)
    })
  })
})
