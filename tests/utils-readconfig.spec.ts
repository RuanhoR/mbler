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
      { virtual: true }
    )

    mockReadFile.mockRejectedValue(new Error('ENOENT'))

    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig('/project2')
    expect(result.name).toBe('@scope/test')
  })
})
