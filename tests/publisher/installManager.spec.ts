import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

const mockWriteFile = vi.hoisted(() => vi.fn())

vi.mock('node:fs/promises', () => ({
  writeFile: mockWriteFile,
}))

vi.mock('../../src/config', () => ({
  default: {
    defaultPmnxBASE: 'https://d.pmnx.qzz.io',
  },
}))

import { InstallManager } from '../../src/publisher/installManager'

describe('InstallManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('download', () => {
    it('should download package and write to file', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      })
      mockWriteFile.mockResolvedValue(undefined)

      await InstallManager.download('@scope', 'mypkg', '1.0.0', '/tmp/out.zip')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://d.pmnx.qzz.io/package/%40scope/mypkg/v/1.0.0/download'
      )
      expect(mockWriteFile).toHaveBeenCalledWith(
        '/tmp/out.zip',
        expect.any(Buffer)
      )
    })

    it('should encode scope correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(1)),
      })
      mockWriteFile.mockResolvedValue(undefined)

      await InstallManager.download('scope', 'pkg', '1.0.0', '/tmp/o.zip')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('%40scope')
      )

      await InstallManager.download('@scope2', 'pkg', '1.0.0', '/tmp/o.zip')
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('%40scope2')
      )
    })

    it('should throw on HTTP error', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(
        InstallManager.download('@s', 'n', '1.0.0', '/tmp/o.zip')
      ).rejects.toThrow('Failed to download package: 404 Not Found')
    })
  })

  describe('info', () => {
    it('should return package info on success', async () => {
      const mockData = {
        id: 'test-id',
        versions: [{ name: '1.0.0', version_tag: 'latest' }],
        download: 10,
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 200, data: mockData }),
      })

      const result = await InstallManager.info('@scope', 'mypkg')
      expect(result).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith(
        'https://d.pmnx.qzz.io/package/%40scope/mypkg/info'
      )
    })

    it('should throw on non-200 code', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 500, data: 'server error' }),
      })

      await expect(
        InstallManager.info('@scope', 'mypkg')
      ).rejects.toThrow('Failed to get package info')
    })
  })

  describe('versionInfo', () => {
    it('should return version info on success', async () => {
      const mockData = {
        id: 'test-id',
        versions: {
          download_url: 'https://example.com/pkg.zip',
          version_tag: 'latest',
          name: '1.0.0',
        },
      }
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 200, data: mockData }),
      })

      const result = await InstallManager.versionInfo('@scope', 'pkg', '1.0.0')
      expect(result).toEqual(mockData)
    })

    it('should throw on HTTP error for versionInfo', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })

      await expect(
        InstallManager.versionInfo('@s', 'n', '1.0.0')
      ).rejects.toThrow('Failed to get package version info')
    })
  })
})
