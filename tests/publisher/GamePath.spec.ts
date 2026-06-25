import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockInput = vi.hoisted(() => vi.fn())
const mockSetKey = vi.hoisted(() => vi.fn())
const mockGetKey = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    input: mockInput,
  }
})

vi.mock('../../src/publisher/configManager', () => ({
  ConfigManager: {
    setKey: mockSetKey,
    getKey: mockGetKey,
  },
}))

vi.mock('../../src/i18n', () => ({
  default: {
    publish: {
      askTip: 'Enter game path: ',
    },
  },
}))

import { GamePath } from '../../src/publisher/GamePath'

describe('GamePath', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('askPath', () => {
    it('should return path and auto-save to config', async () => {
      mockInput.mockResolvedValue('/path/to/mcbe')
      mockSetKey.mockResolvedValue(true)

      const result = await GamePath.askPath()
      expect(result).toBe('/path/to/mcbe')
      expect(mockSetKey).toHaveBeenCalledWith('gamePath', '/path/to/mcbe')
    })

    it('should not save to config when autoset is false', async () => {
      mockInput.mockResolvedValue('/custom/path')

      const result = await GamePath.askPath(false)
      expect(result).toBe('/custom/path')
      expect(mockSetKey).not.toHaveBeenCalled()
    })

    it('should throw on empty input', async () => {
      mockInput.mockResolvedValue('')

      await expect(GamePath.askPath()).rejects.toThrow('No path provided')
    })
  })

  describe('getPath', () => {
    it('should return path from config', async () => {
      mockGetKey.mockResolvedValue('/stored/path')

      const result = await GamePath.getPath()
      expect(result).toBe('/stored/path')
    })

    it('should return null when no path configured', async () => {
      mockGetKey.mockResolvedValue(undefined)

      const result = await GamePath.getPath()
      expect(result).toBeNull()
    })
  })

  describe('clearPath', () => {
    it('should clear game path in config', async () => {
      mockSetKey.mockResolvedValue(true)

      await GamePath.clearPath()
      expect(mockSetKey).toHaveBeenCalledWith('gamePath', '')
    })
  })

  describe('getPathWithASK', () => {
    it('should return existing path without prompting', async () => {
      mockGetKey.mockResolvedValue('/existing/path')

      const result = await GamePath.getPathWithASK()
      expect(result).toBe('/existing/path')
      expect(mockInput).not.toHaveBeenCalled()
    })

    it('should prompt for path when not configured', async () => {
      mockGetKey.mockResolvedValue(null)
      mockInput.mockResolvedValue('/new/path')
      mockSetKey.mockResolvedValue(true)

      const result = await GamePath.getPathWithASK()
      expect(result).toBe('/new/path')
      expect(mockInput).toHaveBeenCalled()
    })
  })
})
