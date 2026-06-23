import { describe, expect, it } from 'vitest'
import { terserPlugin, esbuildPlugin } from '../src/build/minify'
import type { MblerConfigData } from '../src/types'
import type { Plugin } from 'rolldown'

function getHook<T extends (...args: any[]) => any>(
  plugin: Plugin,
  hook: keyof Plugin,
): T | null {
  const val = plugin[hook]
  if (typeof val === 'function') return val as T
  if (val && typeof val === 'object' && 'handler' in val) {
    return val.handler as T
  }
  return null
}

describe('minify type', () => {
  it('should accept valid minify values', () => {
    const config1: MblerConfigData = {
      name: 'test',
      description: 'test',
      version: '0.0.1',
      mcVersion: '1.21.100',
      minify: 'oxc',
    }
    expect(config1.minify).toBe('oxc')

    const config2: MblerConfigData = {
      name: 'test',
      description: 'test',
      version: '0.0.1',
      mcVersion: '1.21.100',
      minify: 'terser',
    }
    expect(config2.minify).toBe('terser')

    const config3: MblerConfigData = {
      name: 'test',
      description: 'test',
      version: '0.0.1',
      mcVersion: '1.21.100',
      minify: 'esbuild',
    }
    expect(config3.minify).toBe('esbuild')
  })

  it('should allow undefined minify', () => {
    const config: MblerConfigData = {
      name: 'test',
      description: 'test',
      version: '0.0.1',
      mcVersion: '1.21.100',
    }
    expect(config.minify).toBeUndefined()
  })
})

describe('terserPlugin', () => {
  it('should return a Plugin with correct name', () => {
    const plugin = terserPlugin('/test')
    expect(plugin.name).toBe('mbler:terser')
  })

  it('should have generateBundle hook', () => {
    const plugin = terserPlugin('/test')
    expect(getHook(plugin, 'generateBundle')).not.toBeNull()
  })

  it('should throw when terser is not installed', async () => {
    const plugin = terserPlugin('/nonexistent-path-12345')
    const hook = getHook<(outputOptions: any, bundle: any) => Promise<any>>(
      plugin,
      'generateBundle',
    )!
    const chunk = { type: 'chunk' as const, code: 'const x = 1' }
    await expect(
      hook.call({} as any, {} as any, { 'index.js': chunk })
    ).rejects.toThrow(/terser/)
  })
})

describe('esbuildPlugin', () => {
  it('should return a Plugin with correct name', () => {
    const plugin = esbuildPlugin('/test')
    expect(plugin.name).toBe('mbler:esbuild')
  })

  it('should have generateBundle hook', () => {
    const plugin = esbuildPlugin('/test')
    expect(getHook(plugin, 'generateBundle')).not.toBeNull()
  })

  it('should throw when esbuild is not installed', async () => {
    const plugin = esbuildPlugin('/nonexistent-path-12345')
    const hook = getHook<(outputOptions: any, bundle: any) => Promise<any>>(
      plugin,
      'generateBundle',
    )!
    const chunk = { type: 'chunk' as const, code: 'const x = 1' }
    await expect(
      hook.call({} as any, {} as any, { 'index.js': chunk })
    ).rejects.toThrow(/esbuild/)
  })
})
