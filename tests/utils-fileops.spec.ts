import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as os from 'node:os'

describe('Utils - writeJSON and fileExists', () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = path.join(os.tmpdir(), `mbler-test-${Date.now()}`)
    await fs.mkdir(tmpDir, { recursive: true })
  })

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true })
  })

  it('writeJSON should create file with correct content', async () => {
    const { writeJSON } = await import('../../src/utils/index')
    const testFile = path.join(tmpDir, 'test.json')
    await writeJSON(testFile, { a: 1, b: [2, 3] })

    const content = await fs.readFile(testFile, 'utf-8')
    expect(JSON.parse(content)).toEqual({ a: 1, b: [2, 3] })
  })

  it('fileExists should return false for non-existent', async () => {
    const { fileExists } = await import('../../src/utils/index')
    const result = await fileExists(path.join(tmpDir, 'nonexistent.txt'))
    expect(result).toBe(false)
  })

  it('fileExists should return true for existing file', async () => {
    const { writeJSON, fileExists } = await import('../../src/utils/index')
    const testFile = path.join(tmpDir, 'exists-test.json')
    await writeJSON(testFile, {})
    const result = await fileExists(testFile)
    expect(result).toBe(true)
  })

  it('writeJSON should create nested directories', async () => {
    const { writeJSON } = await import('../../src/utils/index')
    const nestedFile = path.join(tmpDir, 'nested', 'deep', 'config.json')
    await writeJSON(nestedFile, { key: 'value' })

    const exists = await fs.stat(nestedFile).then(() => true).catch(() => false)
    expect(exists).toBe(true)
  })
})
