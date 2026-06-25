import { describe, it, expect, vi } from 'vitest'
import { createRequire } from 'node:module'

describe('minify plugins internals', () => {
  it('should resolve terser from baseBuildDir', () => {
    const resolve = createRequire('/tmp/noop.js').resolve
    expect(() => resolve('terser', { paths: ['/nonexistent'] })).toThrow()
  })

  it('should resolve esbuild from baseBuildDir', () => {
    const resolve = createRequire('/tmp/noop.js').resolve
    expect(() => resolve('esbuild', { paths: ['/nonexistent'] })).toThrow()
  })
})
