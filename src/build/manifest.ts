import { extname } from 'node:path'
import {
  ManifestData,
  MblerConfigData,
  MblerManifestCapability,
  MblerManifestDependency,
  MblerPackScope
} from '../types'
import { stringToNumberArray } from '../utils'
import { fromString } from '../uuid'
import MBLERVersion from '../version'
import { BuildConfig } from './config'
import Sapi from './sapi'

function isModuleDependency(
  dep: MblerManifestDependency
): dep is { module_name?: string; uuid?: string; version: string } {
  return 'module_name' in dep || 'uuid' in dep
}

async function generateManifest(
  config: MblerConfigData,
  type: 'data' | 'resources'
): Promise<ManifestData> {
  const manifestConfig = config.manifest
  const packScope = manifestConfig?.pack_scope
  if (
    packScope &&
    !Object.values(MblerPackScope).includes(packScope)
  ) {
    throw new TypeError(
      `ERR: [mbler]: manifest.pack_scope must be one of ${Object.values(MblerPackScope).join(', ')}, got: ${packScope}`
    )
  }
  const configName = config.name || 'unknown'
  const configVersion = config.version || '0.0.0'
  const hashRaw = `${configName}-${type}-${config.script?.lang || 'js'}--mbler-hash-raw--:build-manifest`
  const manifest: ManifestData = {
    format_version: 2,
    header: {
      name: config.displayName || configName,
      description: config.description,
      uuid: fromString(hashRaw, BuildConfig.salt.header),
      version: stringToNumberArray(configVersion),
      min_engine_version: stringToNumberArray(
        typeof config.mcVersion === 'string'
          ? config.mcVersion
          : (() => {
              throw new Error('mcVersion in mblerconfig should be a string')
            })()
      ),
    },
    modules: [
      {
        type: type,
        uuid: fromString(hashRaw, BuildConfig.salt.module),
        description: `From Mbler(https://github.com/RuanhoR/mbler). welcome to star and contribute!`,
        version: stringToNumberArray(configVersion),
      },
    ],
  }
  if (packScope) manifest.header.pack_scope = packScope
  if (manifestConfig?.platform_locked !== undefined) {
    manifest.header.platform_locked = manifestConfig.platform_locked
  }
  if (manifestConfig?.base_game_version) {
    manifest.header.base_game_version = stringToNumberArray(
      manifestConfig.base_game_version
    )
  }
  if (manifestConfig?.allow_random_seed !== undefined) {
    manifest.header.allow_random_seed = manifestConfig.allow_random_seed
  }
  if (manifestConfig?.lock_template_options !== undefined) {
    manifest.header.lock_template_options =
      manifestConfig.lock_template_options
  }
  if (type === 'data' && config.script) {
    let entry: string
    if (config.script.lang == 'mcx') {
      entry = 'scripts/index.js'
    } else {
      const filename = config.script.main || 'index.js'
      const extName = extname(filename)
      const base = extName ? filename.slice(0, -extName.length) : filename
      entry = `scripts/${base}.js`
    }
    manifest.modules.push({
      type: 'script',
      entry: entry,
      language: 'javascript',
      uuid: fromString(hashRaw, BuildConfig.salt.sapi),
      description: `sapi generate by mbler, weclome to download and star at https://github.com/RuanhoR/mbler`,
      version: stringToNumberArray(configVersion),
    })
    manifest.capabilities = [MblerManifestCapability.ScriptEval]
    manifest.dependencies = [
      {
        module_name: '@minecraft/server',
        version: await Sapi.generateVersion(
          '@minecraft/server',
          config.mcVersion,
          config.script?.UseBeta || false,
          false
        ),
      },
    ]
    if (config.script.ui) {
      manifest.dependencies.push({
        module_name: '@minecraft/server-ui',
        version: await Sapi.generateVersion(
          '@minecraft/server-ui',
          config.mcVersion,
          config.script?.UseBeta || false,
          false
        ),
      })
    }
    const otherDeps = config.build?.otherDeps
    if (otherDeps && typeof otherDeps === 'object') {
      for (const [moduleName, version] of Object.entries(otherDeps)) {
        manifest.dependencies.push({ module_name: moduleName, version })
      }
    }
  }
  const userCapabilities = manifestConfig?.capabilities
  if (userCapabilities && userCapabilities.length > 0) {
    manifest.capabilities = manifest.capabilities
      ? [...new Set([...manifest.capabilities, ...userCapabilities])]
      : [...new Set(userCapabilities)]
  }
  const userDependencies = manifestConfig?.dependencies
  if (userDependencies && userDependencies.length > 0) {
    manifest.dependencies = [
      ...(manifest.dependencies || []),
      ...userDependencies.filter((dep) => isModuleDependency(dep) || dep.uuid),
    ]
  }
  if (manifestConfig?.subpacks && manifestConfig.subpacks.length > 0) {
    manifest.subpacks = manifestConfig.subpacks
  }
  if (manifestConfig?.settings && manifestConfig.settings.length > 0) {
    manifest.settings = manifestConfig.settings
  }
  manifest.metadata = {
    ...manifestConfig?.metadata,
    generated_with: {
      mbler: [stringToNumberArray(MBLERVersion.version)],
    },
  }
  return manifest
}
export default generateManifest
