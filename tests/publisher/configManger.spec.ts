import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFileExists = vi.hoisted(() => vi.fn())
const mockWriteJSON = vi.hoisted(() => vi.fn())
const mockReadJSON = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    fileExists: mockFileExists,
    writeJSON: mockWriteJSON,
    readFileAsJson: mockReadJSON,
  }
})

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
}))

vi.mock('../../src/config', () => ({
  default: {
    tmpdir: '/tmp/.mbler',
    defaultPmnxBASE: 'https://d.pmnx.qzz.io',
  },
}))

vi.mock('../../src/logger', () => ({
  default: {
    e: vi.fn(),
  },
}))

import { ConfigManger } from '../../src/publisher/configManger'

function resetState() {
  const c = ConfigManger as unknown as Record<string, unknown>
  c.cacheValue = {}
  c.currentConfigPath = ''
  c.lastAccess = 0
  c.lockPromise = null
  c.lockResolver = null
}

describe('ConfigManger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetState()
  })

  describe('getKey', () => {
    it('should load config from file and return key value', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockResolvedValue(true)
      mockReadJSON.mockResolvedValue({ myKey: 'myValue' })

      const result = await ConfigManger.getKey<string>('myKey')
      expect(result).toBe('myValue')
      // ensureConfigFile parses the config, loadConfigToCache also parses it
      expect(mockReadJSON).toHaveBeenCalledWith('/mock/config.json')
    })

    it('should return cached value on subsequent calls', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockResolvedValue(true)
      mockReadJSON.mockResolvedValue({ cachedKey: 'cachedValue' })

      // First call populates cache
      const result1 = await ConfigManger.getKey<string>('cachedKey')
      expect(result1).toBe('cachedValue')

      // Clear the readJSON spy so we can detect new calls
      mockReadJSON.mockClear()

      // Second call should use cache, not reload from file
      const result2 = await ConfigManger.getKey<string>('cachedKey')
      expect(result2).toBe('cachedValue')

      // ensureConfigFile still calls readJSON to validate, but loadConfigToCache should NOT
      // Total calls to readJSON should be just the one from ensureConfigFile
      expect(mockReadJSON).toHaveBeenCalledTimes(1)
    })

    it('should return undefined for missing key', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockResolvedValue(true)
      mockReadJSON.mockResolvedValue({})

      const result = await ConfigManger.getKey<string>('nonexistent')
      expect(result).toBeUndefined()
    })

    it('should handle file read errors gracefully', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockRejectedValue(new Error('File error'))

      const result = await ConfigManger.getKey<string>('any')
      expect(result).toBeUndefined()
    })
  })

  describe('setKey', () => {
    it('should set key and persist to file', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockResolvedValue(true)
      mockReadJSON.mockResolvedValue({})
      mockWriteJSON.mockResolvedValue(undefined)

      const result = await ConfigManger.setKey('myKey', 'myValue')
      expect(result).toBe(true)
      expect(mockWriteJSON).toHaveBeenCalled()
      const c = ConfigManger as unknown as Record<string, unknown>
      expect((c.cacheValue as Record<string, unknown>).myKey).toBe('myValue')
    })

    it('should overwrite existing key', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockResolvedValue(true)
      mockReadJSON.mockResolvedValue({ existingKey: 'oldValue' })
      mockWriteJSON.mockResolvedValue(undefined)

      await ConfigManger.setKey('existingKey', 'newValue')
      const c = ConfigManger as unknown as Record<string, unknown>
      expect((c.cacheValue as Record<string, unknown>).existingKey).toBe(
        'newValue'
      )
    })

    it('should return false on error', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockRejectedValue(new Error('disk full'))

      const result = await ConfigManger.setKey('key', 'val')
      expect(result).toBe(false)
    })
  })

  describe('init', () => {
    it('should create config file with defaults if not exists', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockResolvedValue(false)
      mockWriteJSON.mockResolvedValue(undefined)

      await ConfigManger.init({ initialized: true })
      expect(mockWriteJSON).toHaveBeenCalledWith('/mock/config.json', {
        initialized: true,
      })
    })

    it('should not create config file if already exists', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/mock/config.json' })
      )
      ConfigManger.defaultConfigPoint = '/mock/config.json'
      mockFileExists.mockResolvedValue(true)

      await ConfigManger.init({ initialized: true })
      expect(mockWriteJSON).not.toHaveBeenCalled()
    })
  })

  describe('getConfigPoint', () => {
    it('should return existing config point', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({ point: '/custom/config.json', update: '2024-01-01' })
      )

      const point = await ConfigManger.getConfigPoint()
      expect(point).toBe('/custom/config.json')
    })

    it('should create default config point if missing', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      mockFileExists.mockResolvedValue(false)
      mockWriteJSON.mockResolvedValue(undefined)

      const point = await ConfigManger.getConfigPoint()
      expect(point).toBe(ConfigManger.defaultConfigPoint)
    })
  })
})
