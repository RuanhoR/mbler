import { beforeEach, describe, expect, it, vi } from 'vitest'
import generateManifest from '../../src/build/manifest'
import MBLERVersion from '../../src/version'
import {
  MblerConfigData,
  MblerManifestCapability,
  MblerManifestProductType,
  MblerManifestSettingType,
  MblerPackScope
} from '../../src/types'
import { stringToNumberArray } from '../../src/utils'

vi.mock('../../src/build/sapi', () => ({
  default: {
    generateVersion: vi.fn(async (moduleName: string) => `1.0.0-${moduleName}`)
  }
}))

function baseConfig(overrides: Partial<MblerConfigData> = {}): MblerConfigData {
  return {
    name: 'test',
    displayName: 'Test Pack',
    description: 'a test pack',
    version: '1.2.3',
    mcVersion: '1.21.100',
    ...overrides
  }
}

describe('generateManifest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('generates a resources manifest with format_version 2', async () => {
    const manifest = await generateManifest(baseConfig(), 'resources')
    expect(manifest.format_version).toBe(2)
    expect(manifest.header.name).toBe('Test Pack')
    expect(manifest.header.description).toBe('a test pack')
    expect(manifest.header.version).toEqual([1, 2, 3])
    expect(manifest.header.min_engine_version).toEqual([1, 21, 100])
    expect(manifest.header.uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
    expect(manifest.modules[0]?.type).toBe('resources')
    expect(manifest.modules[0]?.version).toEqual([1, 2, 3])
    expect(manifest.metadata?.generated_with?.mbler).toEqual([
      stringToNumberArray(MBLERVersion.version)
    ])
    expect(manifest.subpacks).toBeUndefined()
    expect(manifest.settings).toBeUndefined()
  })

  it('generates a behavior manifest with script module and sapi deps', async () => {
    const manifest = await generateManifest(
      baseConfig({ script: { main: 'index.js' } }),
      'data'
    )
    expect(manifest.modules).toHaveLength(2)
    expect(manifest.modules[1]?.type).toBe('script')
    expect(manifest.modules[1]?.language).toBe('javascript')
    expect(manifest.modules[1]?.entry).toBe('scripts/index.js')
    expect(manifest.capabilities).toEqual([MblerManifestCapability.ScriptEval])
    expect(manifest.dependencies).toEqual([
      { module_name: '@minecraft/server', version: '1.0.0-@minecraft/server' }
    ])
  })

  it('adds server-ui dep when script.ui is enabled', async () => {
    const manifest = await generateManifest(
      baseConfig({ script: { main: 'index.js', ui: true } }),
      'data'
    )
    expect(manifest.dependencies).toHaveLength(2)
    expect(manifest.dependencies?.[1]?.module_name).toBe(
      '@minecraft/server-ui'
    )
  })

  it('merges user capabilities with script_eval without duplicates', async () => {
    const manifest = await generateManifest(
      baseConfig({
        script: { main: 'index.js' },
        manifest: {
          capabilities: [
            MblerManifestCapability.Chemistry,
            MblerManifestCapability.ScriptEval,
            MblerManifestCapability.Pbr
          ]
        }
      }),
      'data'
    )
    expect(manifest.capabilities).toEqual([
      MblerManifestCapability.ScriptEval,
      MblerManifestCapability.Chemistry,
      MblerManifestCapability.Pbr
    ])
  })

  it('adds capabilities to packs without scripts', async () => {
    const manifest = await generateManifest(
      baseConfig({
        manifest: { capabilities: [MblerManifestCapability.Raytraced] }
      }),
      'resources'
    )
    expect(manifest.capabilities).toEqual([MblerManifestCapability.Raytraced])
  })

  it('appends user dependencies after sapi deps', async () => {
    const manifest = await generateManifest(
      baseConfig({
        script: { main: 'index.js' },
        manifest: {
          dependencies: [
            {
              uuid: '9a1b2c3d-0000-0000-0000-000000000000',
              version: [1, 0, 0],
              name: 'dep pack'
            },
            { module_name: '@minecraft/server-admin', version: '1.0.0-beta' },
            { module_name: '@minecraft/server-gametest', version: 'beta' }
          ]
        }
      }),
      'data'
    )
    expect(manifest.dependencies).toHaveLength(4)
    expect(manifest.dependencies?.[1]).toEqual({
      uuid: '9a1b2c3d-0000-0000-0000-000000000000',
      version: [1, 0, 0],
      name: 'dep pack'
    })
    expect(manifest.dependencies?.[2]).toEqual({
      module_name: '@minecraft/server-admin',
      version: '1.0.0-beta'
    })
    expect(manifest.dependencies?.[3]).toEqual({
      module_name: '@minecraft/server-gametest',
      version: 'beta'
    })
  })

  it('applies header extras', async () => {
    const manifest = await generateManifest(
      baseConfig({
        manifest: {
          pack_scope: MblerPackScope.World,
          platform_locked: true,
          base_game_version: '1.21.0',
          allow_random_seed: true,
          lock_template_options: true
        }
      }),
      'resources'
    )
    expect(manifest.header.pack_scope).toBe(MblerPackScope.World)
    expect(manifest.header.platform_locked).toBe(true)
    expect(manifest.header.base_game_version).toEqual([1, 21, 0])
    expect(manifest.header.allow_random_seed).toBe(true)
    expect(manifest.header.lock_template_options).toBe(true)
  })

  it('applies subpacks, settings and metadata', async () => {
    const manifest = await generateManifest(
      baseConfig({
        manifest: {
          subpacks: [
            {
              name: 'Low',
              folder_name: 'low',
              memory_tier: 0,
              memory_performance_tier: 2
            }
          ],
          settings: [
            { type: MblerManifestSettingType.Label, text: 'Settings' },
            {
              type: MblerManifestSettingType.Input,
              name: 'player_name',
              text: 'Name',
              default: 'x'
            },
            {
              type: MblerManifestSettingType.Toggle,
              name: 'on',
              text: 'On',
              default: true
            },
            {
              type: MblerManifestSettingType.Slider,
              name: 'size',
              text: 'Size',
              min: 0,
              max: 10,
              step: 1,
              default: 5
            },
            {
              type: MblerManifestSettingType.Dropdown,
              name: 'mode',
              text: 'Mode',
              options: ['a', { text: 'B', name: 'b' }],
              default: 'a'
            }
          ],
          metadata: {
            authors: ['alice', 'bob'],
            license: 'MIT',
            url: 'https://example.com',
            product_type: MblerManifestProductType.Addon
          }
        }
      }),
      'resources'
    )
    expect(manifest.subpacks).toEqual([
      {
        name: 'Low',
        folder_name: 'low',
        memory_tier: 0,
        memory_performance_tier: 2
      }
    ])
    expect(manifest.settings).toHaveLength(5)
    expect(manifest.settings?.[3]).toEqual({
      type: MblerManifestSettingType.Slider,
      name: 'size',
      text: 'Size',
      min: 0,
      max: 10,
      step: 1,
      default: 5
    })
    expect(manifest.metadata?.authors).toEqual(['alice', 'bob'])
    expect(manifest.metadata?.license).toBe('MIT')
    expect(manifest.metadata?.url).toBe('https://example.com')
    expect(manifest.metadata?.product_type).toBe(
      MblerManifestProductType.Addon
    )
    expect(manifest.metadata?.generated_with?.mbler).toBeDefined()
  })

  it('throws on invalid pack_scope', async () => {
    await expect(
      generateManifest(
        baseConfig({
          manifest: { pack_scope: 'invalid' as unknown as MblerPackScope }
        }),
        'resources'
      )
    ).rejects.toThrow(/pack_scope/)
  })

  it('throws when mcVersion is not a string', async () => {
    await expect(
      generateManifest(
        baseConfig({
          mcVersion: ['1.21.100'] as unknown as string
        }),
        'resources'
      )
    ).rejects.toThrow(/mcVersion/)
  })
})
