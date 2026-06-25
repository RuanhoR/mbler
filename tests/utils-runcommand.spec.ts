import { describe, it, expect, vi, afterEach } from 'vitest'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('runCommand with stdout capture', () => {
  it('should capture stdout data from a command', async () => {
    const { runCommand } = await import('../../src/utils/index')
    const result = await runCommand(
      [process.execPath, '-e', 'process.stdout.write("hello")'],
      '/tmp',
      'pipe',
    )
    expect(result.code).toBe(0)
    expect(result.data).toBe('hello')
  })
})

describe('showText edge cases', () => {
  it('should handle showText without newline', async () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    const { showText, flushOutputQueue } = await import('../../src/utils/index')
    showText('inline', false)
    await flushOutputQueue()
    expect(process.stdout.write).toHaveBeenCalledWith('inline')
  })
})
