import { extname } from 'node:path'
import { ManifestData, MblerConfigData } from '../types'
import { stringToNumberArray } from '../utils'
import { fromString } from '../uuid'
import { BuildConfig } from './config'
import Sapi from './sapi'
import { evalVersion } from './sapi'
async function generateManifest(
  config: MblerConfigData,
  type: 'data' | 'resources'
): Promise<ManifestData> {
  const hashRaw = `${config.name}-${type}-${config.script?.lang || 'js'}--mbler-hash-raw--:build-manifest`
  const manifest: ManifestData = {
    format_version: 2,
    header: {
      name: config.name,
      description: config.description,
      uuid: fromString(hashRaw, BuildConfig.salt.header),
      version: stringToNumberArray(config.version),
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
        version: stringToNumberArray(config.version),
      },
    ],
  }
  if (type === 'data' && config.script) {
    const isBundle = config.build?.bundle !== false
    const outputDir = config.build?.outputDir || 'scripts'
    let entry: string
    if (isBundle) {
      let filename = config.script.main || 'index.js'
      if (config.build?.outputFilename) {
        filename = config.build.outputFilename
      }
      const extName = extname(filename)
      if (extName !== '.js') {
        filename = filename.slice(0, -extName.length) + '.js'
      }
      if (config.script.lang == 'mcx') {
        entry = `${outputDir}/index.js`
      } else {
        entry = `${outputDir}/${filename}`
      }
    } else {
      entry = `${outputDir}/${config.script.main || 'index.js'}`
      const extName = extname(entry)
      if (extName !== '.js') {
        entry = entry.slice(0, -extName.length) + '.js'
      }
    }
    manifest.modules.push({
      type: 'script',
      entry: entry,
      language: 'javascript',
      uuid: fromString(hashRaw, BuildConfig.salt.sapi),
      description: `sapi generate by mbler, weclome to download and star at https://github.com/RuanhoR/mbler`,
      version: stringToNumberArray(config.version),
    })
    manifest.capabilities = ['script_eval']
    manifest.dependencies = [
      {
        module_name: '@minecraft/server',
        version: evalVersion(
          await Sapi.generateVersion(
            '@minecraft/server',
            config.mcVersion,
            config.script?.UseBeta || false,
            false
          )
        ), // only major.minor.patch, remove -beta or -rc
      },
    ]
    if (config.script.ui) {
      manifest.dependencies.push({
        module_name: '@minecraft/server-ui',
        version: evalVersion(
          await Sapi.generateVersion(
            '@minecraft/server-ui',
            config.mcVersion,
            config.script?.UseBeta || false,
            false
          )
        ), // only major.minor.patch, remove -beta or -rc
      })
    }
  }
  return manifest
}
export default generateManifest
