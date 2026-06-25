import { describe, it, expect } from 'vitest'
import { terserPlugin, esbuildPlugin } from '../../src/build/minify'

function getHook<T extends (...args: any[]) => any>(
  plugin: { [key: string]: any },
  hook: string,
): T | null {
  const val = plugin[hook]
  if (typeof val === 'function') return val as T
  if (val && typeof val === 'object' && 'handler' in val) {
    return val.handler as T
  }
  return null
}

describe('terserPlugin generateBundle with asset avoidance', () => {
  it('should skip non-chunk entries and minify chunks', async () => {
    const plugin = terserPlugin(process.cwd())
    const hook = getHook<(o: any, b: any) => Promise<void>>(plugin, 'generateBundle')!
    const chunk = { type: 'chunk' as const, code: 'const x = 1;' }
    const asset = { type: 'asset' as const, fileName: 'a.txt', source: '' }
    const bundle: Record<string, any> = { 'a.txt': asset, 'out.js': chunk }
    await hook.call({} as any, {} as any, bundle)
    expect(chunk.code).toMatch(/const\s+x/)
  })
})

describe('esbuildPlugin generateBundle with asset avoidance', () => {
  it('should skip non-chunk entries and transform chunks', async () => {
    const plugin = esbuildPlugin(process.cwd())
    const hook = getHook<(o: any, b: any) => Promise<void>>(plugin, 'generateBundle')!
    const chunk = { type: 'chunk' as const, code: 'const y = 2;' }
    const asset = { type: 'asset' as const, fileName: 'b.txt', source: '' }
    const bundle: Record<string, any> = { 'b.txt': asset, 'out.js': chunk }
    await hook.call({} as any, {} as any, bundle)
    expect(chunk.code).toMatch(/const\s+y/)
  })
})
