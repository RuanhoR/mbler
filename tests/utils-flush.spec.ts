import { describe, it, expect, vi } from 'vitest'

describe('flushOutputQueue edge cases', () => {
  it('should handle empty queue gracefully', async () => {
    const { flushOutputQueue } = await import('../src/utils/index')
    await expect(flushOutputQueue()).resolves.toBeUndefined()
  })

  it('should flush queued text', async () => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)

    const { showText, flushOutputQueue } = await import('../src/utils/index')
    showText('test line 1')
    showText('test line 2')
    await flushOutputQueue()

    expect(process.stdout.write).toHaveBeenCalledTimes(2)
  })
})
