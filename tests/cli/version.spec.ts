import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFileExists = vi.hoisted(() => vi.fn())
const mockIsValidVersion = vi.hoisted(() => vi.fn())
const mockReadFileAsJson = vi.hoisted(() => vi.fn())
const mockShowText = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  fileExists: mockFileExists,
  isValidVersion: mockIsValidVersion,
  readFileAsJson: mockReadFileAsJson,
  showText: mockShowText,
}))

vi.mock('../../src/version', () => ({
  default: { commit: 'abc123', version: '1.0.0' },
}))

import { versionCommand } from '../../src/cli/version'

describe('versionCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show version with no args', async () => {
    const code = await versionCommand.handler({
      args: { version: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
    expect(mockShowText).toHaveBeenCalled()
  })

  it('should show commit when --show=commit', async () => {
    const code = await versionCommand.handler({
      args: { version: undefined },
      opts: { show: 'commit' },
      workDir: '/test',
    })
    expect(code).toBe(0)
  })

  it('should show version when --show=version', async () => {
    const code = await versionCommand.handler({
      args: { version: undefined },
      opts: { show: 'version' },
      workDir: '/test',
    })
    expect(code).toBe(0)
  })

  it('should handle invalid show param', async () => {
    const code = await versionCommand.handler({
      args: { version: undefined },
      opts: { show: 'invalid' },
      workDir: '/test',
    })
    expect(code).toBe(0)
  })

  it('should reject invalid version', async () => {
    mockFileExists.mockResolvedValue(true)
    mockIsValidVersion.mockReturnValue(false)

    const code = await versionCommand.handler({
      args: { version: 'bad-version' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(1)
  })

  it('should set version when valid', async () => {
    mockFileExists.mockResolvedValue(true)
    mockIsValidVersion.mockReturnValue(true)
    mockReadFileAsJson.mockResolvedValue({ version: '0.0.1' })

    const code = await versionCommand.handler({
      args: { version: '1.0.0' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
  })
})
