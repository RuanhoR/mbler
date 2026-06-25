import { describe, it, expect, beforeEach, vi } from 'vitest'

const mockReadFileSync = vi.hoisted(() => vi.fn())
const mockExistsSync = vi.hoisted(() => vi.fn())
const mockMkdirSync = vi.hoisted(() => vi.fn())
const mockWriteFileSync = vi.hoisted(() => vi.fn())

vi.mock('node:fs', () => ({
  default: {
    readFileSync: mockReadFileSync,
    existsSync: mockExistsSync,
    mkdirSync: mockMkdirSync,
    writeFileSync: mockWriteFileSync,
  },
  readFileSync: mockReadFileSync,
  existsSync: mockExistsSync,
  mkdirSync: mockMkdirSync,
  writeFileSync: mockWriteFileSync,
}))

vi.mock('../src/version', () => ({
  default: { commit: 'abc123', version: '1.0.0' },
}))

import i18n from '../src/i18n'

describe('i18n', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should default to zh', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    expect(i18n.__internal.class.currentLang).toBe('zh')
  })

  it('should change language via __internal.set', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error('ENOENT')
    })
    mockExistsSync.mockReturnValue(false)
    mockMkdirSync.mockReturnValue(undefined)
    mockWriteFileSync.mockReturnValue(undefined)

    i18n.__internal.set('en')
    expect(i18n.__internal.class.currentLang).toBe('en')
    expect(mockWriteFileSync).toHaveBeenCalled()
  })

  it('should have help text', () => {
    expect(i18n.help).toBeDefined()
    expect(i18n.help.build).toBeDefined()
    expect(i18n.help.init).toBeDefined()
    expect(i18n.help.publish).toBeDefined()
  })

  it('should have commander.selectTip', () => {
    expect(i18n.commander.selectTip).toBeDefined()
  })
})
