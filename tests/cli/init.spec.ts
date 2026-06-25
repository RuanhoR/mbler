import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRunCommand = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  runCommand: mockRunCommand,
}))

import { initCommand } from '../../src/cli/init'

describe('initCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should use pnpm when available', async () => {
    mockRunCommand.mockResolvedValue({ code: 0, data: '9.0.0' })

    const code = await initCommand.handler({
      args: { args: undefined },
      opts: {},
      workDir: '/test',
    })

    expect(code).toBe(0)
    expect(mockRunCommand).toHaveBeenCalledWith(
      ['pnpm', '--version'],
      '/test',
      'ignore'
    )
  })

  it('should fallback to npm when pnpm is not available', async () => {
    mockRunCommand.mockResolvedValue({ code: -1, data: '' })

    const code = await initCommand.handler({
      args: { args: undefined },
      opts: {},
      workDir: '/test',
    })

    expect(code).toBe(-1)
  })

  it('should pass extra args to create command', async () => {
    mockRunCommand.mockResolvedValue({ code: 0, data: '9.0.0' })

    await initCommand.handler({
      args: { args: 'extra arg' },
      opts: {},
      workDir: '/test-dir',
    })

    expect(mockRunCommand).toHaveBeenCalledWith(
      expect.arrayContaining(['pnpm', '--version']),
      '/test-dir',
      'ignore'
    )
  })
})
