import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockReadFile = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn())
const mockMkdir = vi.hoisted(() => vi.fn())
const mockStat = vi.hoisted(() => vi.fn())
const mockRm = vi.hoisted(() => vi.fn())

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  stat: mockStat,
  rm: mockRm,
}))

const mockFileExists = vi.hoisted(() => vi.fn())

vi.mock('../../src/utils', () => ({
  fileExists: mockFileExists,
}))

vi.mock('../../src/i18n', () => ({
  default: {
    help: {
      lang: 'lang help',
    },
    workdir: {
      set: '[path to]: ',
      nfound: "not found this dir(can't create or not directory)",
      disabled: 'Work dir disabled',
      enabled: 'Work dir enabled',
      invalidParam: 'Invalid param',
    },
  },
}))

vi.mock('../../src/logger', () => ({
  default: { e: vi.fn() },
}))

import WorkDirManager from '../../src/cli/WorkDirManager'

describe('WorkDirManager', () => {
  let manager: WorkDirManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new WorkDirManager('/tmp/.test-mbler-mp.db')
  })

  describe('isDisabled', () => {
    it('should return false when enabled file exists', async () => {
      mockReadFile.mockResolvedValue('1')
      const disabled = await manager.isDisabled()
      expect(disabled).toBe(false)
    })

    it('should return true when enabled file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      const disabled = await manager.isDisabled()
      expect(disabled).toBe(true)
    })
  })

  describe('setDisabled', () => {
    it('should write enabled file when disabled=false', async () => {
      mockWriteFile.mockResolvedValue(undefined)
      await manager.setDisabled(false)
      expect(mockWriteFile).toHaveBeenCalled()
    })

    it('should remove enabled file when disabled=true', async () => {
      mockRm.mockResolvedValue(undefined)
      await manager.setDisabled(true)
      expect(mockRm).toHaveBeenCalled()
    })
  })

  describe('get', () => {
    it('should return cwd when disabled', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'))
      const result = await manager.get()
      expect(result).toBe(process.cwd())
    })

    it('should return cached work point if set', async () => {
      const cacheDir = '/tmp/.test-mbler-mp-cache.db'
      mockReadFile.mockImplementation(async (filePath: string) => {
        if (filePath === cacheDir) return '/tmp'
        return '1'
      })
      const m = new WorkDirManager(cacheDir)
      mockStat.mockResolvedValue({ isDirectory: () => true })
      mockFileExists.mockResolvedValue(true)
      mockWriteFile.mockResolvedValue(undefined)
      await m.set('/tmp')

      const result = await m.get()
      expect(result).toBe('/tmp')
    })
  })
})
