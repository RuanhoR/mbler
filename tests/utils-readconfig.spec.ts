import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as path from 'node:path'
import { mkdtempSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'

describe('Utils - ReadProjectMblerConfig', () => {
  let tmpDir: string

  function writeConfig(content: string) {
    writeFileSync(path.join(tmpDir, 'mbler.config.js'), content)
  }

  function writePkg(json: Record<string, unknown>) {
    writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify(json))
  }

  beforeEach(() => {
    tmpDir = mkdtempSync(path.join(tmpdir(), 'mbler-test-'))
  })

  afterEach(() => {
    if (tmpDir && existsSync(tmpDir)) {
      rmSync(tmpDir, { recursive: true, force: true })
    }
  })

  it('should read config from mbler.config.js', async () => {
    writeConfig(
      `export default { name: "@scope/test", description: "Test project", version: "1.0.0", mcVersion: "1.21.100" }`
    )
    writePkg({ name: '@scope/test', version: '1.0.0' })
    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig(tmpDir)
    expect(result.name).toBeDefined()
  })

  it('should handle missing package.json', async () => {
    writeConfig(
      `export default { name: "@scope/test", description: "desc", version: "1.0.0", mcVersion: "1.21.100" }`
    )
    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig(tmpDir)
    expect(result.name).toBe('@scope/test')
  })

  it('should reject config missing description', async () => {
    writeConfig(
      `export default { name: "@scope/test", mcVersion: "1.21.100" }`
    )
    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    await expect(ReadProjectMblerConfig(tmpDir)).rejects.toThrow(
      "'description' is required in mbler.config.js"
    )
  })

  it('should reject config missing mcVersion', async () => {
    writeConfig(
      `export default { name: "@scope/test", description: "desc" }`
    )
    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    await expect(ReadProjectMblerConfig(tmpDir)).rejects.toThrow(
      "'mcVersion' is required in mbler.config.js"
    )
  })

  it('should reject config with empty description', async () => {
    writeConfig(
      `export default { name: "@scope/test", description: "", mcVersion: "1.21.100" }`
    )
    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    await expect(ReadProjectMblerConfig(tmpDir)).rejects.toThrow(
      "'description' is required in mbler.config.js"
    )
  })

  it('should use defaults for optional fields', async () => {
    writeConfig(
      `export default { description: "desc", mcVersion: "1.21.100" }`
    )
    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig(tmpDir)
    expect(result.outdir?.behavior).toBe('dist/dep')
    expect(result.minify).toBe('oxc')
    expect(result.outGameOnDev).toBe(false)
  })

  it('should reject unknown config keys', async () => {
    writeConfig(
      `export default { description: "desc", mcVersion: "1.21.100", unknownField: "oops" }`
    )
    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    await expect(ReadProjectMblerConfig(tmpDir)).rejects.toThrow(
      "Unexpected 'unknownField'"
    )
  })

  it('should override outdir with user config', async () => {
    writeConfig(
      `export default { description: "desc", mcVersion: "1.21.100", outdir: { behavior: "custom/bp" } }`
    )
    const { ReadProjectMblerConfig } = await import('../src/utils/index')
    const result = await ReadProjectMblerConfig(tmpDir)
    expect(result.outdir?.behavior).toBe('custom/bp')
  })
})
