import { describe, expect, it, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { build } from '../../src/build'
import { mapScriptOutputName } from '../../src/build/rollup'
import type { MblerConfigData } from '../../src/types'

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

function createProject(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mbler-nobundle-'))
  tempDirs.push(dir)
  fs.mkdirSync(path.join(dir, 'node_modules'), { recursive: true })
  fs.mkdirSync(path.join(dir, 'behavior', 'scripts'), { recursive: true })
  fs.writeFileSync(
    path.join(dir, 'behavior', 'manifest.json'),
    '{"format_version": 2}'
  )
  return dir
}

function writeScript(dir: string, rel: string, content: string): void {
  const full = path.join(dir, 'behavior', 'scripts', rel)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
}

function makeConfig(minify: 'oxc' | 'none'): MblerConfigData {
  return {
    name: 'test/nobundle',
    description: 'test',
    mcVersion: '1.21.100',
    minify,
    script: { main: 'index.ts', lang: 'ts' },
    build: { bundle: false },
  }
}

function outScriptsDir(dir: string): string {
  return path.join(dir, 'dist', 'dep', 'scripts')
}

describe('bundle: false script transform', () => {
  it('transpiles each script file via rolldown, keeping one output per module', async () => {
    const dir = createProject()
    writeScript(
      dir,
      'index.ts',
      [
        "import { greet } from './utils/helper'",
        "import { world } from '@minecraft/server'",
        'const start = (): void => {',
        '  console.log(greet(world.getDimension("overworld").id))',
        '}',
        'export { start }',
      ].join('\n')
    )
    writeScript(
      dir,
      'utils/helper.ts',
      [
        'const debugTag = "helper-debug-tag"',
        'export function greet(name: string): string {',
        '  return debugTag + name',
        '}',
      ].join('\n')
    )
    writeScript(dir, 'types.d.ts', 'export type Nothing = never')
    writeScript(dir, 'data.json', '{"a": 1}')

    const code = await build(makeConfig('oxc'), dir)
    expect(code).toBe(0)

    const outScripts = outScriptsDir(dir)
    expect(fs.existsSync(path.join(outScripts, 'index.js'))).toBe(true)
    expect(fs.existsSync(path.join(outScripts, 'utils', 'helper.js'))).toBe(true)
    expect(fs.existsSync(path.join(outScripts, 'index.ts'))).toBe(false)
    expect(fs.existsSync(path.join(outScripts, 'types.d.ts'))).toBe(false)
    expect(fs.existsSync(path.join(outScripts, 'data.json'))).toBe(true)

    const index = fs.readFileSync(path.join(outScripts, 'index.js'), 'utf-8')
    expect(index).toContain('./utils/helper.js')
    expect(index).toContain('@minecraft/server')

    const helper = fs.readFileSync(
      path.join(outScripts, 'utils', 'helper.js'),
      'utf-8'
    )
    expect(helper).toContain('helper-debug-tag')
    expect(helper).not.toContain('debugTag')
  })

  it('keeps readable output when minify is none', async () => {
    const dir = createProject()
    writeScript(
      dir,
      'index.ts',
      'export const main = (): string => "main script entry"'
    )
    const code = await build(makeConfig('none'), dir)
    expect(code).toBe(0)

    const index = fs.readFileSync(
      path.join(outScriptsDir(dir), 'index.js'),
      'utf-8'
    )
    expect(index).toContain('main script entry')
    expect(index).toMatch(/\bconst\b/)
  })
})

describe('mapScriptOutputName', () => {
  it('maps source names to output names', () => {
    expect(mapScriptOutputName('index.ts')).toBe('index.js')
    expect(mapScriptOutputName('main.mts')).toBe('main.js')
    expect(mapScriptOutputName('Event.mcx')).toBe('Event.mcx.js')
    expect(mapScriptOutputName('sub\\dir\\Event.mcx')).toBe(
      'sub/dir/Event.mcx.js'
    )
    expect(mapScriptOutputName('main.js')).toBe('main.js')
    expect(mapScriptOutputName('data.json')).toBe('data.json')
  })
})
