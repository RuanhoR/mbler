import path, { join } from 'node:path'
import type { MblerConfigData } from '../types'
import i18n from '../i18n'
import { showText } from '../utils'
import { GamePath } from '../publisher/GamePath'
import { BuildConfig } from './config'

export interface SourceDirs {
  behavior: string
  resources: string
}

export interface OutDirs {
  behavior: string
  resources: string
  dist: string
}

export function resolveSourceDirs(baseBuildDir: string): SourceDirs {
  return {
    behavior: path.join(baseBuildDir, BuildConfig.behavior),
    resources: path.join(baseBuildDir, BuildConfig.resources)
  }
}

export async function resolveOutDirs(
  config: MblerConfigData,
  baseBuildDir: string
): Promise<OutDirs> {
  if (config.outGameOnDev && process.env.BUILD_MODULE != 'release') {
    showText(i18n.build.noBuildModuleRelease)
    const gamePath = await GamePath.getPathWithASK()
    const packName = (config.name ?? 'unknown')
      .replace(/^@/, '')
      .replace('/', '-')
    return {
      behavior: path.join(gamePath, 'development_behavior_packs', packName),
      resources: path.join(gamePath, 'development_resource_packs', packName),
      dist: config.outdir?.dist
        ? join(baseBuildDir, config.outdir.dist)
        : path.join(baseBuildDir, 'dist-pkg')
    }
  }
  return {
    behavior: config.outdir?.behavior
      ? join(baseBuildDir, config.outdir.behavior)
      : path.join(baseBuildDir, 'dist/dep'),
    resources: config.outdir?.resources
      ? join(baseBuildDir, config.outdir.resources)
      : path.join(baseBuildDir, 'dist/res'),
    dist: config.outdir?.dist
      ? join(baseBuildDir, config.outdir.dist)
      : path.join(baseBuildDir, 'dist-pkg')
  }
}
