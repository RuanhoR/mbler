import { describe, it, expect, afterEach } from 'vitest'
import { resolveSpawnCommand } from '../src/utils/index'

const realPlatform = process.platform

function mockPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: platform })
}

afterEach(() => {
  Object.defineProperty(process, 'platform', { value: realPlatform })
})

describe('resolveSpawnCommand on posix', () => {
  it('should pass through without shell', () => {
    mockPlatform('linux')
    expect(resolveSpawnCommand('npm', ['run', 'build'])).toEqual({
      file: 'npm',
      args: ['run', 'build'],
      shell: false,
    })
  })

  it('should not reject shell metacharacters because shell is not used', () => {
    mockPlatform('linux')
    const result = resolveSpawnCommand('sh', ['-c', 'echo hi & echo bye'])
    expect(result).toEqual({
      file: 'sh',
      args: ['-c', 'echo hi & echo bye'],
      shell: false,
    })
  })
})

describe('resolveSpawnCommand on win32', () => {
  it('should join pure-safe args into one shell command line', () => {
    mockPlatform('win32')
    expect(resolveSpawnCommand('pnpm', ['run', 'build'])).toEqual({
      file: 'pnpm run build',
      args: [],
      shell: true,
    })
  })

  it('should quote args containing spaces', () => {
    mockPlatform('win32')
    expect(
      resolveSpawnCommand('pnpm', [
        'create',
        'mbler',
        '--',
        'D:\\My Project\\addon',
      ])
    ).toEqual({
      file: 'pnpm create mbler -- "D:\\My Project\\addon"',
      args: [],
      shell: true,
    })
  })

  it('should treat % as unsafe after removal from fast path', () => {
    mockPlatform('win32')
    expect(() => resolveSpawnCommand('cmd', ['/c', 'echo %PATH%'])).toThrow(
      /%PATH%/
    )
  })

  it.each(['&', '|', '<', '>', '^', '%', '"'])(
    'should reject args containing %s',
    (meta) => {
      mockPlatform('win32')
      const arg = `C:\\bad${meta}name`
      expect(() => resolveSpawnCommand('node', [arg])).toThrow(
        JSON.stringify(arg)
      )
    }
  )

  it('should reject args containing CR or LF', () => {
    mockPlatform('win32')
    expect(() => resolveSpawnCommand('node', ['a\r\nb'])).toThrow(/a\\r\\nb/)
    expect(() => resolveSpawnCommand('node', ['a\nb'])).toThrow()
  })

  it('should reject when the command file itself contains metacharacters', () => {
    mockPlatform('win32')
    expect(() => resolveSpawnCommand('foo&calc', ['run', 'build'])).toThrow(
      /foo&calc/
    )
  })

  it('should still accept normal windows paths with spaces', () => {
    mockPlatform('win32')
    expect(() =>
      resolveSpawnCommand('npm', [
        'install',
        'C:\\Users\\Some User\\AppData\\Local\\Temp\\pkg dir',
      ])
    ).not.toThrow()
  })
})
