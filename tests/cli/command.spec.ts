import { describe, it, expect } from 'vitest'
import { defineCommand, parseArgs, parseRawParams } from '../../src/cli/command'

describe('defineCommand', () => {
  it('should return the same command def', () => {
    const def = defineCommand({
      name: 'test',
      aliases: [],
      description: 'test cmd',
      args: [],
      options: [],
      handler: () => 0,
    })
    expect(def.name).toBe('test')
    expect(def.description).toBe('test cmd')
  })
})

describe('parseArgs', () => {
  it('should extract positional args by name', () => {
    const def = defineCommand({
      name: 'test',
      aliases: [],
      description: '',
      args: [{ name: 'pkg', description: '', required: true }],
      options: [],
      handler: () => 0,
    })
    const args = parseArgs(def, ['@scope/name'])
    expect(args.pkg).toBe('@scope/name')
  })

  it('should map args by position', () => {
    const def = defineCommand({
      name: 'test',
      aliases: [],
      description: '',
      args: [{ name: 'a', description: '' }, { name: 'b', description: '' }],
      options: [],
      handler: () => 0,
    })
    const args = parseArgs(def, ['x', 'y'])
    expect(args.a).toBe('x')
    expect(args.b).toBe('y')
  })

  it('should set missing optional args as undefined', () => {
    const def = defineCommand({
      name: 'test',
      aliases: [],
      description: '',
      args: [{ name: 'a', description: '' }, { name: 'b', description: '' }],
      options: [],
      handler: () => 0,
    })
    const args = parseArgs(def, ['only-a'])
    expect(args.a).toBe('only-a')
    expect(args.b).toBeUndefined()
  })

  it('should throw for missing required args', () => {
    const def = defineCommand({
      name: 'test',
      aliases: [],
      description: '',
      args: [{ name: 'req', description: '', required: true }],
      options: [],
      handler: () => 0,
    })
    expect(() => parseArgs(def, [])).toThrow('Missing required argument')
  })

  it('should join variadic args with spaces', () => {
    const def = defineCommand({
      name: 'test',
      aliases: [],
      description: '',
      args: [{ name: 'rest', description: '', variadic: true }],
      options: [],
      handler: () => 0,
    })
    const args = parseArgs(def, ['a', 'b', 'c'])
    expect(args.rest).toBe('a b c')
  })

  it('should set empty variadic as undefined', () => {
    const def = defineCommand({
      name: 'test',
      aliases: [],
      description: '',
      args: [{ name: 'rest', description: '', variadic: true }],
      options: [],
      handler: () => 0,
    })
    const args = parseArgs(def, [])
    expect(args.rest).toBeUndefined()
  })

  it('should handle mixed required and optional args with variadic last', () => {
    const def = defineCommand({
      name: 'test',
      aliases: [],
      description: '',
      args: [
        { name: 'cmd', description: '', required: true },
        { name: 'key', description: '' },
        { name: 'value', description: '', variadic: true },
      ],
      options: [],
      handler: () => 0,
    })
    const args = parseArgs(def, ['set', 'mykey', 'hello', 'world'])
    expect(args.cmd).toBe('set')
    expect(args.key).toBe('mykey')
    expect(args.value).toBe('hello world')
  })
})

describe('parseRawParams', () => {
  it('should parse positional params', () => {
    const result = parseRawParams(['cmd', 'arg1'])
    expect(result.params).toEqual(['cmd', 'arg1'])
    expect(result.opts).toEqual({})
  })

  it('should parse -flag value options', () => {
    const result = parseRawParams(['cmd', '-tag', 'latest'])
    expect(result.params).toEqual(['cmd'])
    expect(result.opts).toEqual({ tag: 'latest' })
  })

  it('should parse -flag=value options', () => {
    const result = parseRawParams(['cmd', '-tag=latest'])
    expect(result.params).toEqual(['cmd'])
    expect(result.opts).toEqual({ tag: 'latest' })
  })

  it('should handle flag with no value', () => {
    const result = parseRawParams(['cmd', '-verbose'])
    expect(result.params).toEqual(['cmd'])
    expect(result.opts).toEqual({ verbose: '' })
  })

  it('should handle consecutive flags', () => {
    const result = parseRawParams(['cmd', '-a', '-b', 'val'])
    expect(result.params).toEqual(['cmd'])
    expect(result.opts).toEqual({ a: '', b: 'val' })
  })

  it('should handle flag before next flag without value', () => {
    const result = parseRawParams(['-a', '-b'])
    expect(result.params).toEqual([])
    expect(result.opts).toEqual({ a: '', b: '' })
  })

  it('should handle empty input', () => {
    const result = parseRawParams([])
    expect(result.params).toEqual([])
    expect(result.opts).toEqual({})
  })

  it('should handle mixed flags and params', () => {
    const result = parseRawParams([
      'install',
      '@scope/name',
      '-tag',
      'beta',
      '-build',
      'skip',
    ])
    expect(result.params).toEqual(['install', '@scope/name'])
    expect(result.opts).toEqual({ tag: 'beta', build: 'skip' })
  })

  it('should handle -flag with = containing special chars', () => {
    const result = parseRawParams(['-show=commit'])
    expect(result.params).toEqual([])
    expect(result.opts).toEqual({ show: 'commit' })
  })

  it('should flag-only at end should not consume next', () => {
    const result = parseRawParams(['cmd', 'arg', '-x'])
    expect(result.params).toEqual(['cmd', 'arg'])
    expect(result.opts).toEqual({ x: '' })
  })
})
