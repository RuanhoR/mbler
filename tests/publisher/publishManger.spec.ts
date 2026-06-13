import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

const mockFileExists = vi.hoisted(() => vi.fn())
const mockFindReadme = vi.hoisted(() => vi.fn())
const mockReadFileAsJson = vi.hoisted(() => vi.fn())
const mockReadProjectMblerConfig = vi.hoisted(() => vi.fn())
const mockReadFile = vi.hoisted(() => vi.fn())

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
      packageNameInvalid:
        'Package name must be in the format of @scope/name',
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

import { PublishManger } from '../../src/publisher/publishManger'
import { TokenManger } from '../../src/publisher/tokenManger'

function resetTokenState() {
  const t = TokenManger as unknown as Record<string, unknown>
  t.memoryToken = null
  t.isLogin = false
  t.isLoading = false
  t.user = null
  t.task = undefined
}

function setupConfigWithToken(token: string) {
  // getConfigPoint() reads a pointer file — return valid JSON for any path
  mockReadFile.mockImplementation(async (filePath: string) => {
    if (filePath.toString().includes('_config_point.json')) {
      return JSON.stringify({ point: '/mock/config.json' })
    }
    return Buffer.from('zip content')
  })
  // ensureConfigFile checks fileExists
  mockFileExists.mockResolvedValue(true)
  // loadConfigToCache reads the config file -> return object with token
  mockReadFileAsJson.mockResolvedValue({ token })
}

describe('PublishManger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetTokenState()
  })

  describe('unpublish', () => {
    it('should send unpublish request with token', async () => {
      const t = TokenManger as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('valid-token')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ code: 200, data: {} }),
      })

      await PublishManger.unpublish('@scope', 'pkg', '1.0.0')
      expect(mockFetch).toHaveBeenCalledWith(
        'https://d.pmnx.qzz.io/unpublish/@scope/pkg/1.0.0',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer valid-token',
          }),
        })
      )
    })

    it('should throw when not logged in', async () => {
      const t = TokenManger as unknown as Record<string, unknown>
      t.isLogin = false
      t.isLoading = false

      await expect(
        PublishManger.unpublish('@s', 'n', '1.0.0')
      ).rejects.toThrow('Not logged in')
    })
  })

  describe('createSession', () => {
    it('should create session and return session key', async () => {
      const t = TokenManger as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('my-token')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { sessionKey: 'session-abc-123' },
          }),
      })

      const session = await PublishManger.createSession({
        readme: 'readme content',
        scope: '@scope',
        name: 'pkg',
        version: '1.0.0',
        version_tag: 'latest',
      })

      expect(session).toBe('session-abc-123')
    })

    it('should fallback to sessionId', async () => {
      const t = TokenManger as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('my-token')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            data: { sessionId: 'session-xyz' },
          }),
      })

      const session = await PublishManger.createSession({
        readme: 'r',
        scope: '@s',
        name: 'n',
        version: '1.0.0',
        version_tag: 'latest',
      })

      expect(session).toBe('session-xyz')
    })
  })

  describe('publishToMarketplace', () => {
    it('should upload zip file successfully', async () => {
      const t = TokenManger as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('upload-token')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'successfully uploaded' }),
      })

      const result = await PublishManger.publishToMarketplace(
        '/tmp/file.zip',
        'session-123'
      )
      expect(result).toBe(true)
    })

    it('should throw on upload failure', async () => {
      const t = TokenManger as unknown as Record<string, unknown>
      t.isLogin = true
      t.isLoading = false
      setupConfigWithToken('token')

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'error occurred' }),
      })

      await expect(
        PublishManger.publishToMarketplace('/tmp/file.zip', 'session-123')
      ).rejects.toThrow('Failed to upload zip file')
    })
  })

  describe('buildProject', () => {
    it('should throw when package.json missing', async () => {
      mockReadFileAsJson.mockRejectedValue(new Error('ENOENT'))

      await expect(PublishManger.buildProject('/project')).rejects.toThrow()
    })
  })
})
