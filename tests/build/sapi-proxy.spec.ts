import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

vi.mock('../../src/config', () => ({
  default: {
    tmpdir: '/tmp/.mbler',
  },
}))

vi.mock('../../src/version', () => ({
  default: { commit: 'abc', version: '1.0.0' },
}))

// Need to mock fs for cache file
const mockReadFile = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn())
const mockMkdir = vi.hoisted(() => vi.fn())

vi.mock('node:fs', () => ({
  default: {
    promises: {
      readFile: mockReadFile,
      writeFile: mockWriteFile,
      mkdir: mockMkdir,
    },
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
  },
  promises: {
    readFile: mockReadFile,
    writeFile: mockWriteFile,
    mkdir: mockMkdir,
  },
}))

describe('SAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate version with full info', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'))
    mockMkdir.mockResolvedValue(undefined)
    mockWriteFile.mockResolvedValue(undefined)

    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('@minecraft/server-ui')) {
        return {
          ok: true,
          json: () =>
            Promise.resolve({
              versions: {
                '1.0.0-beta.1.21.100-stable': {},
                '1.0.0-beta.1.21.100': {},
                '1.5.0-beta.1.21.110-stable': {},
                '2.1.0-beta.1.21.100-stable': {},
                '2.1.0-beta.1.21.100': {},
              },
            }),
        }
      }
      return {
        ok: true,
        json: () =>
          Promise.resolve({
            versions: {
              '1.0.0-beta.1.21.100-stable': {},
              '1.0.0-beta.1.21.100': {},
              '1.5.0-beta.1.21.110-stable': {},
            },
          }),
      }
    })

    const sapi = (await import('../../src/build/sapi')).default

    const version = await sapi.generateVersion(
      '@minecraft/server-ui',
      '1.21.100',
      false,
      true
    )
    expect(version).toBeTruthy()
  })
})
