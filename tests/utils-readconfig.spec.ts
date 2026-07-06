import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as path from 'node:path'

const mockReadFile = vi.hoisted(() => vi.fn())
const mockMkdir = vi.hoisted(() => vi.fn())
const mockStat = vi.hoisted(() => vi.fn())
const mockWriteFile = vi.hoisted(() => vi.fn())

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
  mkdir: mockMkdir,
  stat: mockStat,
  writeFile: mockWriteFile,
}))

describe('Utils - ReadProjectMblerConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should read config from mbler.config.js', async () => {
    vi.doMock(
      path.join('/project', 'mbler.config.js'),
      () => ({
        default: {
          name: '@scope/test',
          description: 'Test project',
          version: '1.0.0',
          mcVersion: '1.21.100',
        },
      }),
      // @ts-expect-error virtual option supported at runtime
      { virtual: true }
    )

    mockReadFile.mockImplementation(async (filePath: string) => {
      if (filePath.endsWith('package.json')) {
        return JSON.stringify({ name: '@scope/test', version: '1.0.0' })
      }
      throw new Error('ENOENT')
    })

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig('/project')
    expect(result.name).toBeDefined()
  })

  it('should handle missing package.json', async () => {
    vi.doMock(
      path.join('/project2', 'mbler.config.js'),
      () => ({
        default: {
          name: '@scope/test',
          description: 'desc',
          version: '1.0.0',
          mcVersion: '1.21.100',
        },
      }),
      // @ts-expect-error virtual option supported at runtime
      { virtual: true }
    )

    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig('/project2')
    expect(result.name).toBe('@scope/test')
  })

  it('should reject config missing description', async () => {
    vi.doMock(
      path.join('/proj-node', 'mbler.config.js'),
      () => ({
        default: {
          name: '@scope/test',
          mcVersion: '1.21.100',
        },
      }),
      // @ts-expect-error virtual option supported at runtime
      { virtual: true }
    )

    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    await expect(ReadProjectMblerConfig('/proj-node')).rejects.toThrow(
      "'description' is required in mbler.config.js"
    )
  })

  it('should reject config missing mcVersion', async () => {
    vi.doMock(
      path.join('/proj-nomv', 'mbler.config.js'),
      () => ({
        default: {
          name: '@scope/test',
          description: 'desc',
        },
      }),
      // @ts-expect-error virtual option supported at runtime
      { virtual: true }
    )

    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    await expect(ReadProjectMblerConfig('/proj-nomv')).rejects.toThrow(
      "'mcVersion' is required in mbler.config.js"
    )
  })

  it('should reject config with empty description', async () => {
    vi.doMock(
      path.join('/proj-emdesc', 'mbler.config.js'),
      () => ({
        default: {
          name: '@scope/test',
          description: '',
          mcVersion: '1.21.100',
        },
      }),
      // @ts-expect-error virtual option supported at runtime
      { virtual: true }
    )

    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    await expect(ReadProjectMblerConfig('/proj-emdesc')).rejects.toThrow(
      "'description' is required in mbler.config.js"
    )
  })

  it('should use defaults for optional fields', async () => {
    vi.doMock(
      path.join('/proj-def', 'mbler.config.js'),
      () => ({
        default: {
          description: 'desc',
          mcVersion: '1.21.100',
        },
      }),
      // @ts-expect-error virtual option supported at runtime
      { virtual: true }
    )

    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig('/proj-def')
    expect(result.outdir?.behavior).toBe('dist/dep')
    expect(result.minify).toBe('oxc')
    expect(result.outGameOnDev).toBe(false)
  })

  it('should reject unknown config keys', async () => {
    vi.doMock(
      path.join('/proj-unk', 'mbler.config.js'),
      () => ({
        default: {
          description: 'desc',
          mcVersion: '1.21.100',
          unknownField: 'oops',
        },
      }),
      // @ts-expect-error virtual option supported at runtime
      { virtual: true }
    )

    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    await expect(ReadProjectMblerConfig('/proj-unk')).rejects.toThrow(
      "Unexpected 'unknownField'"
    )
  })

  it('should override outdir with user config', async () => {
    vi.doMock(
      path.join('/proj-od', 'mbler.config.js'),
      () => ({
        default: {
          description: 'desc',
          mcVersion: '1.21.100',
          outdir: { behavior: 'custom/bp' },
        },
      }),
      // @ts-expect-error virtual option supported at runtime
      { virtual: true }
    )

    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig('/proj-od')
    expect(result.outdir?.behavior).toBe('custom/bp')
  })
})
