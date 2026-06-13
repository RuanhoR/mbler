import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import sapi from '../src/build/sapi'
import { isValidVersion } from '../src/utils'
import { generateRelease } from '../src/build/release'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mbler-test-'))
}

function createTestFile(
  dir: string,
  filePath: string,
  content: string = 'test'
) {
  const fullPath = path.join(dir, filePath)
  fs.mkdirSync(path.dirname(fullPath), { recursive: true })
  fs.writeFileSync(fullPath, content, 'utf-8')
}

describe('generateRelease', () => {
  const originalBuildModule = process.env.BUILD_MODULE

  beforeEach(() => {
    process.env.BUILD_MODULE = 'release'
  })

  afterEach(() => {
    process.env.BUILD_MODULE = originalBuildModule
  })

  it('should skip when BUILD_MODULE is not release', async () => {
    process.env.BUILD_MODULE = 'dev'
    const tmpDir = createTempDir()
    const distPath = path.join(tmpDir, 'out.mcaddon')
    await generateRelease({
      outdirs: { behavior: tmpDir, resources: tmpDir, dist: distPath },
      module: 'all',
    })
    expect(fs.existsSync(distPath)).toBe(false)
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should package behavior module only', async () => {
    const tmpDir = createTempDir()
    const bpDir = path.join(tmpDir, 'bp')
    const distPath = path.join(tmpDir, 'out.mcaddon')
    fs.mkdirSync(bpDir, { recursive: true })
    createTestFile(bpDir, 'manifest.json', '{"format_version": 2}')
    createTestFile(bpDir, 'scripts/main.js', 'console.log("hello")')

    await generateRelease({
      outdirs: { behavior: bpDir, resources: bpDir, dist: distPath },
      module: 'behavior',
    })

    expect(fs.existsSync(distPath)).toBe(true)
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(distPath)
    const entries = zip.getEntries()
    const names = entries.map((e: { entryName: string }) => e.entryName)
    expect(names).toContain('manifest.json')
    expect(names).toContain('scripts/main.js')
    expect(names).not.toContain('behavior/')
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should package resources module only', async () => {
    const tmpDir = createTempDir()
    const rpDir = path.join(tmpDir, 'rp')
    const distPath = path.join(tmpDir, 'out.mcaddon')
    fs.mkdirSync(rpDir, { recursive: true })
    createTestFile(rpDir, 'manifest.json', '{"format_version": 2}')
    createTestFile(rpDir, 'texts/en_US.lang', 'title=Test')

    await generateRelease({
      outdirs: { behavior: rpDir, resources: rpDir, dist: distPath },
      module: 'resources',
    })

    expect(fs.existsSync(distPath)).toBe(true)
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(distPath)
    const entries = zip.getEntries()
    const names = entries.map((e: { entryName: string }) => e.entryName)
    expect(names).toContain('manifest.json')
    expect(names).toContain('texts/en_US.lang')
    expect(names).not.toContain('resources/')
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should package both behavior and resources with all module', async () => {
    const tmpDir = createTempDir()
    const bpDir = path.join(tmpDir, 'bp')
    const rpDir = path.join(tmpDir, 'rp')
    const distPath = path.join(tmpDir, 'out.mcaddon')
    fs.mkdirSync(bpDir, { recursive: true })
    fs.mkdirSync(rpDir, { recursive: true })
    createTestFile(bpDir, 'manifest.json', '{"format_version": 2}')
    createTestFile(bpDir, 'scripts/main.js', 'console.log("hello")')
    createTestFile(rpDir, 'manifest.json', '{"format_version": 2}')
    createTestFile(rpDir, 'texts/en_US.lang', 'title=Test')

    await generateRelease({
      outdirs: { behavior: bpDir, resources: rpDir, dist: distPath },
      module: 'all',
    })

    expect(fs.existsSync(distPath)).toBe(true)
    const AdmZip = require('adm-zip')
    const zip = new AdmZip(distPath)
    const entries = zip.getEntries()
    const names = entries.map((e: { entryName: string }) => e.entryName)
    expect(names).toContain('behavior/manifest.json')
    expect(names).toContain('behavior/scripts/main.js')
    expect(names).toContain('resources/manifest.json')
    expect(names).toContain('resources/texts/en_US.lang')
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should package nested directories in all module', async () => {
    const tmpDir = createTempDir()
    const bpDir = path.join(tmpDir, 'bp')
    const rpDir = path.join(tmpDir, 'rp')
    const distPath = path.join(tmpDir, 'out.mcaddon')
    fs.mkdirSync(bpDir, { recursive: true })
    fs.mkdirSync(rpDir, { recursive: true })
    createTestFile(bpDir, 'items/sword.json', '{"item": "sword"}')
    createTestFile(bpDir, 'entities/player.json', '{"entity": "player"}')
    createTestFile(rpDir, 'textures/items/sword.png', 'png data')
    createTestFile(rpDir, 'texts/zh_CN.lang', 'title=测试')

    await generateRelease({
      outdirs: { behavior: bpDir, resources: rpDir, dist: distPath },
      module: 'all',
    })

    const AdmZip = require('adm-zip')
    const zip = new AdmZip(distPath)
    const entries = zip.getEntries()
    const names = entries.map((e: { entryName: string }) => e.entryName)
    expect(names).toContain('behavior/items/sword.json')
    expect(names).toContain('behavior/entities/player.json')
    expect(names).toContain('resources/textures/items/sword.png')
    expect(names).toContain('resources/texts/zh_CN.lang')
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('should throw when outdirs is missing', async () => {
    await expect(
      generateRelease({
        outdirs: null as unknown as any,
        module: 'all',
      })
    ).rejects.toThrow('invalid Build')
  })
})

describe('sapiVersion', () => {
  it('should out vaild version', async () => {
    expect(
      isValidVersion(
        await sapi.generateVersion('@minecraft/server', '1.21.100', true, false)
      )
    ).toBe(true)
    expect(
      isValidVersion(
        await sapi.generateVersion(
          '@minecraft/server-ui',
          '1.21.100',
          true,
          false
        )
      )
    ).toBe(true)
  })
  it('should out right version', async () => {
    expect(
      await sapi.generateVersion(
        '@minecraft/server-ui',
        '1.21.100',
        false,
        false
      )
    ).toBe('2.1.0-beta')
    expect(
      await sapi.generateVersion(
        '@minecraft/server-ui',
        '1.21.100',
        false,
        true
      )
    ).toBe('2.1.0-beta.1.21.100-stable')
  })
})
