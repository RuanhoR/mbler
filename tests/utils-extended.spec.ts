import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  compareVersion,
  isValidVersion,
  stringToNumberArray,
  join,
  findReadme,
  fileExists,
  writeJSON,
  ReadProjectMblerConfig,
  readFileAsJson,
  sleep,
  showText,
  flushOutputQueue,
  runCommand,
} from '../src/utils/index'
import * as path from 'node:path'

describe('isValidVersion', () => {
  it('should reject empty string after split', () => {
    expect(isValidVersion('-beta')).toBe(false)
  })

  it('should reject non-numeric version parts', () => {
    expect(isValidVersion('a.b.c')).toBe(false)
  })
})

describe('fileExists', () => {
  it('should return true when file exists', async () => {
    const result = await fileExists(__filename)
    expect(result).toBe(true)
  })

  it('should return false when file does not exist', async () => {
    const result = await fileExists('/nonexistent-path-12345')
    expect(result).toBe(false)
  })
})

describe('findReadme', () => {
  it('should find README.md in a directory', async () => {
    const result = await findReadme(path.join(__dirname, '..'))
    expect(result).toBeTruthy()
  })

  it('should return null when no readme exists', async () => {
    const result = await findReadme('/tmp')
    expect(result).toBeNull()
  })
})

describe('writeJSON', () => {
  it('should write json to file', async () => {
    const tmpFile = path.join('/tmp', `test-${Date.now()}.json`)
    await writeJSON(tmpFile, { hello: 'world' })
    const fs = await import('node:fs/promises')
    const content = await fs.readFile(tmpFile, 'utf-8')
    expect(JSON.parse(content)).toEqual({ hello: 'world' })
    await fs.rm(tmpFile)
  })
})

describe('sleep', () => {
  it('should wait for specified time', async () => {
    const start = Date.now()
    await sleep(10)
    expect(Date.now() - start).toBeGreaterThanOrEqual(5)
  })
})

describe('showText / flushOutputQueue', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  it('should queue text and flush', async () => {
    showText('hello world')
    await flushOutputQueue()
    expect(process.stdout.write).toHaveBeenCalledWith('hello world\n')
  })

  it('should support needNextLine false', async () => {
    await flushOutputQueue()
    showText('no-newline', false)
    await flushOutputQueue()
    expect(process.stdout.write).toHaveBeenCalledWith('no-newline')
  })
})

describe('readFileAsJson', () => {
  it('should parse json file', async () => {
    const result = await readFileAsJson<{ name: string }>(
      path.join(__dirname, '..', 'package.json')
    )
    expect(result.name).toBe('mbler')
  })

  it('should throw on non-existent file', async () => {
    await expect(
      readFileAsJson('/nonexistent-path/file.json')
    ).rejects.toThrow()
  })
})

describe('runCommand', () => {
  it('should handle error spawning', async () => {
    const result = await runCommand(
      ['/nonexistent-command-binary'],
      '/tmp',
      'ignore'
    )
    expect(result.code).toBe(-1)
  })
})
