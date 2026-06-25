import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockAppendFile = vi.hoisted(() => vi.fn())
const mockMkdir = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn())
const mockStat = vi.hoisted(() => vi.fn())

vi.mock('node:fs/promises', () => ({
  default: {
    appendFile: mockAppendFile,
    mkdir: mockMkdir,
    writeFile: mockWriteFile,
    stat: mockStat,
  },
  appendFile: mockAppendFile,
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
  stat: mockStat,
}))

import Logger from '../src/logger'

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Logger.run = []
  })

  describe('i', () => {
    it('should write info log', async () => {
      mockStat.mockRejectedValue(new Error('ENOENT'))
      mockMkdir.mockResolvedValue(undefined)
      mockWriteFile.mockResolvedValue(undefined)
      mockAppendFile.mockResolvedValue(undefined)

      Logger.i('TestTag', 'test message')
      await Promise.all(Logger.run)

      expect(mockAppendFile).toHaveBeenCalledOnce()
      const call = mockAppendFile.mock.calls[0][1] as string
      expect(call).toContain('[INFO TestTag]')
      expect(call).toContain('test message')
    })
  })

  describe('w', () => {
    it('should write warn log', async () => {
      mockStat.mockResolvedValue({})
      mockAppendFile.mockResolvedValue(undefined)

      Logger.w('WarnTag', 'warning message')
      await Promise.all(Logger.run)

      const call = mockAppendFile.mock.calls[0][1] as string
      expect(call).toContain('[WARN WarnTag]')
      expect(call).toContain('warning message')
    })
  })

  describe('e', () => {
    it('should write error log', async () => {
      mockStat.mockResolvedValue({})
      mockAppendFile.mockResolvedValue(undefined)

      Logger.e('ErrTag', 'error message')
      await Promise.all(Logger.run)

      const call = mockAppendFile.mock.calls[0][1] as string
      expect(call).toContain('[ERROR ErrTag]')
      expect(call).toContain('error message')
    })
  })

  describe('d', () => {
    it('should write debug log', async () => {
      mockStat.mockResolvedValue({})
      mockAppendFile.mockResolvedValue(undefined)

      Logger.d('DebugTag', 'debug message')
      await Promise.all(Logger.run)

      const call = mockAppendFile.mock.calls[0][1] as string
      expect(call).toContain('[DEBUG DebugTag]')
      expect(call).toContain('debug message')
    })
  })

  it('should have LogFile defined', () => {
    expect(Logger.LogFile).toBeDefined()
    expect(Logger.LogFile).toContain('latest.log')
  })
})
