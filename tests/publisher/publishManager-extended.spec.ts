import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

const mockFileExists = vi.hoisted(() => vi.fn())
const mockFindReadme = vi.hoisted(() => vi.fn())
const mockReadFileAsJson = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())
const mockReadProjectMblerConfig = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...(actual as object),
    fileExists: mockFileExists,
    findReadme: mockFindReadme,
    readFileAsJson: mockReadFileAsJson,
    ReadProjectMblerConfig: mockReadProjectMblerConfig,
  }
})

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
}))

const mockGenerateRelease = vi.hoisted(() => vi.fn())
vi.mock('../../src/build/release', () => ({
  generateRelease: mockGenerateRelease,
}))

vi.mock('../../src/config', () => ({
  default: {
    tmpdir: '/tmp/.mbler',
    defaultPmnxBASE: 'https://d.pmnx.qzz.io',
  },
}))

vi.mock('../../src/i18n', () => ({
  default: {
    publish: {
      projectPathNotExist: 'Project path does not exist',
      publishing: 'Publishing...',
      building: 'Building project...',
      publishToMarket: 'Publishing to marketplace...',
      publishSuccess: 'Publish successful',
      publishResult: '+ {name}@{version} ({tag})',
      outdirNotFound: 'Build output directories not found',
      outdirNotExist: 'Build output directories do not exist',
      readmeNotFound: 'README file not found',
      metadataInvalid: 'Invalid metadata',
      packageNameInvalid: 'Package name must be in the format of @scope/name',
      notLoginError: 'Not logged in',
      tokenMissing: 'Failed to get token',
      unpublishReqFailed: 'Failed to unpublish package',
      createSessionFailed: 'Failed to create publish session',
      uploadZipFailed: 'Failed to upload zip file',
      packageJsonNotFound: 'package.json not found',
      noBuildScript: 'No build script found in package.json',
      buildFailed: 'Build failed with code {code}',
    },
  },
}))

import { PublishManager } from '../../src/publisher/publishManager'
import { TokenManager } from '../../src/publisher/tokenManager'

function resetTokenState() {
  const t = TokenManager as unknown as Record<string, unknown>
  t.memoryToken = null
  t.isLogin = false
  t.isLoading = false
  t.user = null
  t.task = undefined
}

function setupConfigWithToken(token: string) {
  mockFileExists.mockResolvedValue(true)
  mockReadFileAsJson.mockResolvedValue({ token })
  mockReadFile.mockImplementation(async (filePath: string) => {
    if (filePath.toString().includes('_config_point.json')) {
      return JSON.stringify({ point: '/mock/config.json' })
    }
    return Buffer.from('zip content')
  })
}

describe('PublishManager - extended', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTokenState()
  })

  describe('unpublish', () => {
    it('should throw on non-200 response', async () => {
      const t = TokenManager as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('token')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 400, data: 'error' }),
      })

      await expect(
        PublishManager.unpublish('@scope', 'name', '1.0.0')
      ).rejects.toThrow()
    })
  })

  describe('createSession', () => {
    it('should throw on non-ok response', async () => {
      const t = TokenManager as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('token')

      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ data: 'error' }),
      })

      await expect(
        PublishManager.createSession({
          readme: 'r',
          scope: '@s',
          name: 'n',
          version: '1.0.0',
          version_tag: 'latest',
        })
      ).rejects.toThrow()
    })

    it('should throw when sessionKey is missing', async () => {
      const t = TokenManager as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('token')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: {} }),
      })

      await expect(
        PublishManager.createSession({
          readme: 'r',
          scope: '@s',
          name: 'n',
          version: '1.0.0',
          version_tag: 'latest',
        })
      ).rejects.toThrow()
    })
  })

  describe('publishToMarketplace', () => {
    it('should rename .mcaddon to .zip', async () => {
      const t = TokenManager as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('token')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'successfully uploaded' }),
      })

      const result = await PublishManager.publishToMarketplace(
        '/tmp/file.mcaddon',
        'session-123'
      )
      expect(result).toBe(true)
    })
  })

  describe('buildProject', () => {
    it('should throw when no build script', async () => {
      mockReadFileAsJson.mockResolvedValue({
        scripts: {},
        packageManager: 'npm',
      })

      await expect(
        PublishManager.buildProject('/project')
      ).rejects.toThrow('No build script')
    })
  })

  describe('publish', () => {
    it('should throw when project path does not exist', async () => {
      const t = TokenManager as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      mockFileExists.mockResolvedValue(false)

      await expect(
        PublishManager.publish('/nonexistent', { build: 'skip', tag: 'latest' })
      ).rejects.toThrow('Project path does not exist')
    })

    it('should throw when readme not found', async () => {
      const t = TokenManager as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      mockFileExists.mockResolvedValue(true)
      mockReadProjectMblerConfig.mockResolvedValue({
        name: '@scope/name',
        version: '1.0.0',
        description: 'test',
        mcVersion: '1.21.100',
        outdir: { behavior: '/bp', resources: '/rp' },
      })
      mockReadFileAsJson.mockResolvedValue({ name: '@scope/name' })
      mockFindReadme.mockResolvedValue(null)

      await expect(
        PublishManager.publish('/project', { build: 'skip', tag: 'latest' })
      ).rejects.toThrow('README file not found')
    })

    it('should throw on invalid package name format', async () => {
      const t = TokenManager as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      mockFileExists.mockResolvedValue(true)
      mockReadProjectMblerConfig.mockResolvedValue({
        name: 'invalid-name',
        version: '1.0.0',
        description: 'test',
        mcVersion: '1.21.100',
        outdir: { behavior: '/bp', resources: '/rp' },
      })
      mockReadFileAsJson.mockResolvedValue({ name: 'invalid-name' })
      mockFindReadme.mockResolvedValue('/readme.md')
      mockReadFile.mockResolvedValue(Buffer.from('zip'))

      await expect(
        PublishManager.publish('/project', { build: 'skip', tag: 'latest' })
      ).rejects.toThrow('Package name must be in the format of @scope/name')
    })
  })
})
