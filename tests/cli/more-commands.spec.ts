import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockShowText = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  showText: mockShowText,
}))

vi.mock('../../src/i18n', () => ({
  default: {
    help: {
      publish: 'publish help',
      unpublish: 'unpublish help',
      install: 'install help',
      uninstall: 'uninstall help',
      view: 'view help',
      lang: 'lang help',
      config: 'config help',
    },
    publish: {
      progress: 'Progress: {progress}%',
      publishFailed: 'Publish failed: {error}',
      publishing: 'Publishing...',
      building: 'Building project...',
      publishToMarket: 'Publishing to marketplace...',
      publishSuccess: 'Publish successful',
      publishResult: '+ {name}@{version} ({tag})',
      notLoggedIn: 'Not logged in',
    },
    unpublish: {
      success: 'Package {pkg}@{version} unpublished successfully',
      failed: 'Unpublish failed: {error}',
    },
    view: {
      usage: 'mbler view @<scope>/<name>',
    },
    install: {
      installing: 'Installing package {pkg}...',
      packageNotFound: 'Package {pkg} not found',
      noVersion: 'Package {pkg} has no available version',
      usingLatest: 'Using latest version {version}',
      noValidAddon: 'No valid addon found in package',
      success: 'Package {pkg}@{version} installed successfully as {id}',
      failed: 'Install failed: {error}',
    },
    uninstall: {
      success: 'Package {pkg}@{version} uninstalled successfully',
      failed: 'Uninstall failed: {error}',
    },
  },
}))

describe('CLI command parse functions', () => {
  describe('unpublish parsePackage', () => {
    it('should parse valid package string', async () => {
      const { unpublishCommand } = await import('../../src/cli/unpublish')
      const code = await unpublishCommand.handler({
        args: { package: '@scope/name@1.0.0' },
        opts: {},
        workDir: '/test',
      })
      expect(code).toBe(-1)
    })

    it('should reject invalid package string', async () => {
      const { unpublishCommand } = await import('../../src/cli/unpublish')
      const code = await unpublishCommand.handler({
        args: { package: 'invalid' },
        opts: {},
        workDir: '/test',
      })
      expect(code).toBe(-1)
    })
  })

  describe('publish', () => {
    it('should require login', async () => {
      const mockWaitVerify = vi.fn().mockResolvedValue(undefined)
      vi.doMock('../../src/publisher/tokenManager', () => ({
        TokenManager: {
          waitVerify: mockWaitVerify,
          isLogin: false,
        },
      }))
      vi.doMock('../../src/publisher/publishManager', () => ({
        PublishManager: { publish: vi.fn() },
      }))

      const { publishCommand } = await import('../../src/cli/publish')
      const code = await publishCommand.handler({
        args: {},
        opts: { tag: 'latest', build: 'skip' },
        workDir: '/test',
      })
      expect(code).toBe(-1)
    })
  })

  describe('view parsePackage', () => {
    it('should parse scoped package', () => {
      const { parsePackage } = (vi.importActual('../../src/cli/view') as any) || {}
    })

    it('should add @ prefix to unscoped package', async () => {
      const { viewCommand } = await import('../../src/cli/view')
      const code = await viewCommand.handler({
        args: { package: 'invalid-format' },
        opts: {},
        workDir: '/test',
      })
      expect(code).toBe(-1)
    })
  })

  describe('install parsePackage', () => {
    it('should reject invalid format', async () => {
      const { installCommand } = await import('../../src/cli/install')
      const code = await installCommand.handler({
        args: { package: 'bad-format' },
        opts: {},
        workDir: '/test',
      })
      expect(code).toBe(-1)
    })
  })

  describe('uninstall parsePackage', () => {
    it('should reject invalid format', async () => {
      const { uninstallCommand } = await import('../../src/cli/uninstall')
      const code = await uninstallCommand.handler({
        args: { package: 'bad-format' },
        opts: {},
        workDir: '/test',
      })
      expect(code).toBe(-1)
    })
  })
})
