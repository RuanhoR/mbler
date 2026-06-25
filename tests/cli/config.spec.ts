import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockGetKey = vi.hoisted(() => vi.fn())
const mockSetKey = vi.hoisted(() => vi.fn())
const mockGetConfigPoint = vi.hoisted(() => vi.fn())
const mockSetConfigPoint = vi.hoisted(() => vi.fn())

vi.mock('../../src/publisher/configManager', () => ({
  ConfigManager: {
    getKey: mockGetKey,
    setKey: mockSetKey,
    getConfigPoint: mockGetConfigPoint,
    setConfigPoint: mockSetConfigPoint,
  },
}))

vi.mock('../../src/i18n', () => ({
  default: {
    help: {
      config: 'config help text',
      lang: 'lang help',
    },
    config: {
      usage: 'config usage',
      missingArg: 'Missing argument',
      getResult: '{key} = {value}',
      setSuccess: 'Set {key} = {value}',
      pointGet: 'Current config file: {path}',
      pointSetSuccess: 'Config file pointer set to: {path}',
      pointSetFailed: 'Failed to set config pointer: {error}',
      failed: 'Config command failed: {error}',
    },
  },
}))

import { configCommand } from '../../src/cli/config'

describe('configCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get a config key', async () => {
    mockGetKey.mockResolvedValue('some-value')
    const code = await configCommand.handler({
      args: { subcommand: 'get', key: 'token', value: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
    expect(mockGetKey).toHaveBeenCalledWith('token')
  })

  it('should return error when get with no key', async () => {
    const code = await configCommand.handler({
      args: { subcommand: 'get', key: undefined, value: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })

  it('should set a config key', async () => {
    mockSetKey.mockResolvedValue(true)
    const code = await configCommand.handler({
      args: { subcommand: 'set', key: 'token', value: 'new-token' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
    expect(mockSetKey).toHaveBeenCalledWith('token', 'new-token')
  })

  it('should return error when set with no key', async () => {
    const code = await configCommand.handler({
      args: { subcommand: 'set', key: undefined, value: '' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })

  it('should get config point', async () => {
    mockGetConfigPoint.mockResolvedValue('/path/to/config.json')
    const code = await configCommand.handler({
      args: { subcommand: 'point', key: 'get', value: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
    expect(mockGetConfigPoint).toHaveBeenCalled()
  })

  it('should set config point', async () => {
    mockSetConfigPoint.mockResolvedValue(undefined)
    const code = await configCommand.handler({
      args: { subcommand: 'point', key: '/new/path.json', value: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(0)
    expect(mockSetConfigPoint).toHaveBeenCalledWith('/new/path.json')
  })

  it('should handle unknown subcommand', async () => {
    const code = await configCommand.handler({
      args: { subcommand: 'unknown', key: undefined, value: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })

  it('should handle set write failure', async () => {
    mockSetKey.mockResolvedValue(false)
    const code = await configCommand.handler({
      args: { subcommand: 'set', key: 'token', value: 'val' },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })

  it('should handle point set failure', async () => {
    mockSetConfigPoint.mockRejectedValue(new Error('permission denied'))
    const code = await configCommand.handler({
      args: { subcommand: 'point', key: '/bad/path', value: undefined },
      opts: {},
      workDir: '/test',
    })
    expect(code).toBe(-1)
  })
})
