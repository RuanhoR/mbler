import { describe, expect, it, afterEach, vi } from 'vitest'
import * as path from 'node:path'
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  existsSync,
  mkdirSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { createMcxCompileOpt, createRollupBuild } from '../src/build/rollup'
import type { RollupBuildContext } from '../src/build/rollup'
import { ReadProjectMblerConfig } from '../src/utils'
import { templateMblerConfig } from '../src/types'
import type { MblerConfigData, MblerMcxPlugin } from '../src/types'

const { mockRolldownPlugin } = vi.hoisted(() => ({
  mockRolldownPlugin: vi.fn((_opt: unknown, _output: unknown) => ({
    name: 'mock-mcx-core',
  })),
}))

vi.mock('@mbler/mcx-core', () => ({
  setGlobalFS: vi.fn(),
  rolldownPlugin: mockRolldownPlugin,
}))

const tempDirs: string[] = []

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
  }
})

function makeTempDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'mbler-mcx-plugin-'))
  tempDirs.push(dir)
  return dir
}

const plugin: MblerMcxPlugin = {
  name: 'my-layout',
  tags: {
    Layout: (_node, ctx) => {
      ctx.addExport('layout', '{}')
      ctx.setType('layout')
    },
  },
  onTransform: () => {},
}

describe('mbler.config.js mcxPlugin', () => {
  it('is a known config key in the template', () => {
    expect('mcxPlugin' in templateMblerConfig).toBe(true)
  })

  it('reads and preserves a plugin object from mbler.config.js', async () => {
    const dir = makeTempDir()
    writeFileSync(
      path.join(dir, 'mbler.config.js'),
      [
        'export default {',
        '  description: "demo",',
        '  mcVersion: "1.21.100",',
        '  mcxPlugin: { name: "from-config", onTransform() {} },',
        '}',
      ].join('\n')
    )
    writeFileSync(
      path.join(dir, 'package.json'),
      JSON.stringify({ name: '@scope/test', version: '1.0.0' })
    )
    const config = await ReadProjectMblerConfig(dir)
    expect(config.mcxPlugin).toMatchObject({ name: 'from-config' })
    expect(typeof (config.mcxPlugin as MblerMcxPlugin).onTransform).toBe(
      'function'
    )
  })

  it('passes a single plugin into the mcx compiler options', () => {
    const config: MblerConfigData = {
      description: 'demo',
      mcVersion: '1.21.100',
      mcxPlugin: plugin,
    }
    const opt = createMcxCompileOpt(
      config,
      '/project/node_modules',
      '/project/tsconfig.json',
      {} as typeof import('typescript')
    )
    expect(opt.moduleDir).toBe('/project/node_modules')
    expect(opt.tsconfigPath).toBe('/project/tsconfig.json')
    expect(opt.sourcemap).toBe(false)
    expect(opt.mcxPlugin).toBe(plugin)
  })

  it('passes an array of plugins and omits the field when unset', () => {
    const withArray = createMcxCompileOpt(
      {
        description: 'demo',
        mcVersion: '1.21.100',
        mcxPlugin: [plugin, { name: 'second' }],
      },
      '/mods',
      '/tsconfig.json',
      {} as typeof import('typescript')
    )
    expect(withArray.mcxPlugin).toHaveLength(2)
    const without = createMcxCompileOpt(
      { description: 'demo', mcVersion: '1.21.100' },
      '/mods',
      '/tsconfig.json',
      {} as typeof import('typescript')
    )
    expect('mcxPlugin' in without).toBe(false)
  })

  it('forwards mcxPlugin to the core rolldownPlugin during a build', async () => {
    const dir = makeTempDir()
    const behavior = path.join(dir, 'behavior')
    mkdirSync(path.join(behavior, 'scripts'), { recursive: true })
    mkdirSync(path.join(dir, 'node_modules'), { recursive: true })
    writeFileSync(
      path.join(behavior, 'scripts', 'index.ts'),
      'export const start = 1\n'
    )
    writeFileSync(path.join(dir, 'tsconfig.json'), '{}')
    const ctx: RollupBuildContext = {
      currentConfig: {
        description: 'demo',
        mcVersion: '1.21.100',
        script: { lang: 'mcx', main: 'index.ts' },
        mcxPlugin: plugin,
      },
      baseBuildDir: dir,
      srcDirs: { behavior, resources: path.join(dir, 'resources') },
      outdirs: {
        behavior: path.join(dir, 'out', 'behavior'),
        resources: path.join(dir, 'out', 'resources'),
        dist: path.join(dir, 'out', 'dist'),
      },
      buildConfig: {},
      cacheManager: null,
    }
    mockRolldownPlugin.mockClear()
    const { plugins } = await createRollupBuild(ctx)
    expect(plugins.map((item) => item.name)).toContain('mock-mcx-core')
    expect(mockRolldownPlugin).toHaveBeenCalledOnce()
    expect(mockRolldownPlugin.mock.calls[0]?.[0]).toMatchObject({
      mcxPlugin: plugin,
    })
  })
})
