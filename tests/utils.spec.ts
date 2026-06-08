import { describe, it, expect } from 'vitest'
import {
  compareVersion,
  isValidVersion,
  stringToNumberArray,
  join,
} from '../src/utils/index'
import { BuildConfig } from '../src/build/config'
import i18n from '../src/i18n'

describe('compareVersion', () => {
  it('should compare equal versions', () => {
    expect(compareVersion('1.0.0', '1.0.0')).toBe(0)
  })

  it('should detect greater version', () => {
    expect(compareVersion('2.0.0', '1.0.0')).toBeGreaterThan(0)
  })

  it('should detect lesser version', () => {
    expect(compareVersion('1.0.0', '2.0.0')).toBeLessThan(0)
  })

  it('should compare pre-release versions', () => {
    expect(compareVersion('1.0.1', '1.0.0')).toBeGreaterThan(0)
  })

  it('should handle partial versions', () => {
    expect(compareVersion('1.0', '1.0.0')).toBe(0)
  })
})

describe('isValidVersion', () => {
  it('should accept valid semver', () => {
    expect(isValidVersion('1.0.0')).toBe(true)
    expect(isValidVersion('0.0.1')).toBe(true)
    expect(isValidVersion('999.999.999')).toBe(true)
  })

  it('should accept pre-release versions', () => {
    expect(isValidVersion('1.0.0-beta')).toBe(true)
    expect(isValidVersion('2.0.0-rc.1')).toBe(true)
  })

  it('should reject invalid versions', () => {
    expect(isValidVersion('')).toBe(false)
    expect(isValidVersion('abc')).toBe(false)
    expect(isValidVersion('1.0')).toBe(false)
    expect(isValidVersion('1')).toBe(false)
  })
})

describe('stringToNumberArray', () => {
  it('should parse version string to number array', () => {
    expect(stringToNumberArray('1.2.3')).toEqual([1, 2, 3])
  })

  it('should handle single digit', () => {
    expect(stringToNumberArray('0.0.1')).toEqual([0, 0, 1])
  })

  it('should pad to 3 elements', () => {
    const result = stringToNumberArray('1.2.3.4')
    expect(result).toHaveLength(3)
    expect(result).toEqual([1, 2, 3])
  })
})

describe('join', () => {
  it('should join relative paths', () => {
    expect(join('/base', 'sub/file.ts')).toBe('/base/sub/file.ts')
  })

  it('should return absolute path unchanged', () => {
    expect(join('/base', '/absolute/path')).toBe('/absolute/path')
  })
})

describe('BuildConfig', () => {
  it('should have correct config file name', () => {
    expect(BuildConfig.ConfigFile).toBe('mbler.config.js')
  })

  it('should have behavior and resources keys', () => {
    expect(BuildConfig.behavior).toBe('behavior')
    expect(BuildConfig.resources).toBe('resources')
  })

  it('should have salt UUIDs', () => {
    expect(BuildConfig.salt.header).toMatch(
      /^[0-9a-f-]{36}$/,
    )
    expect(BuildConfig.salt.sapi).toMatch(/^[0-9a-f-]{36}$/)
  })
})

describe('i18n', () => {
  it('should provide help text for all commands', () => {
    expect(i18n.help).toBeDefined()
    expect(i18n.help.build).toBeDefined()
    expect(i18n.help.watch).toBeDefined()
    expect(i18n.help.init).toBeDefined()
    expect(i18n.help.install).toBeDefined()
    expect(i18n.help.publish).toBeDefined()
  })
})
