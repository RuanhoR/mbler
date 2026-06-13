import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

const mockSetKey = vi.hoisted(() => vi.fn())
const mockGetKey = vi.hoisted(() => vi.fn())

vi.mock('../../src/publisher/configManger', () => ({
  ConfigManger: {
    setKey: mockSetKey,
    getKey: mockGetKey,
  },
}))

vi.mock('../../src/config', () => ({
  default: {
    defaultPmnxBASE: 'https://d.pmnx.qzz.io',
  },
}))

import { TokenManger } from '../../src/publisher/tokenManger'

function resetState() {
  const t = TokenManger as unknown as Record<string, unknown>
  t.memoryToken = null
  t.isLogin = false
  t.isLoading = true
  t.user = null
  t.task = undefined
}

describe('TokenManger', () => {
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

      await TokenManger.setToken('valid-token')
      expect(TokenManger.memoryToken).toBe('valid-token')
      expect(mockSetKey).toHaveBeenCalledWith('token', 'valid-token')
      expect(TokenManger.isLogin).toBe(true)
      expect(TokenManger.user).toEqual({
        name: 'testuser',
        uid: 1,
        mail: 'a@b.com',
        ctime: 'now',
      })
    })

    it('should throw if config save fails', async () => {
      mockSetKey.mockResolvedValue(false)

      await expect(TokenManger.setToken('token')).rejects.toThrow(
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

      await TokenManger.setToken('  spaced-token  ')
      expect(TokenManger.memoryToken).toBe('spaced-token')
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

      await TokenManger.requestAPI('valid-token')
      expect(TokenManger.isLogin).toBe(true)
      expect(TokenManger.isLoading).toBe(false)
      expect(TokenManger.user?.name).toBe('user')
    })

    it('should set isLogin false on API error', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 400 }),
      })

      await TokenManger.requestAPI('bad-token')
      expect(TokenManger.isLogin).toBe(false)
      expect(TokenManger.isLoading).toBe(false)
    })

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await TokenManger.requestAPI('some-token')
      expect(TokenManger.isLogin).toBe(false)
      expect(TokenManger.isLoading).toBe(false)
    })

    it('should skip when no token provided', async () => {
      await TokenManger.requestAPI()
      expect(mockFetch).not.toHaveBeenCalled()
      expect(TokenManger.isLoading).toBe(false)
    })
  })

  describe('getToken', () => {
    it('should return token from config', async () => {
      mockGetKey.mockResolvedValue('stored-token')

      const token = await TokenManger.getToken()
      expect(token).toBe('stored-token')
      expect(mockGetKey).toHaveBeenCalledWith('token')
    })

    it('should return undefined when no token', async () => {
      mockGetKey.mockResolvedValue(undefined)

      const token = await TokenManger.getToken()
      expect(token).toBeUndefined()
    })
  })

  describe('init', () => {
    it('should verify token from memory', async () => {
      TokenManger.memoryToken = 'mem-token'
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            code: 200,
            data: { name: 'u', uid: 1, mail: 'a@b.com', ctime: 'now' },
          }),
      })

      await TokenManger.init()
      expect(TokenManger.isLogin).toBe(true)
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

      await TokenManger.init()
      expect(mockGetKey).toHaveBeenCalledWith('token')
    })

    it('should set loading false when no token found', async () => {
      mockGetKey.mockResolvedValue(undefined)

      await TokenManger.init()
      expect(TokenManger.isLoading).toBe(false)
      expect(TokenManger.isLogin).toBe(false)
    })
  })
})
