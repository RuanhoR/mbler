import path from 'node:path'
import {
  type Plugin,
  type RolldownBuild,
  type RolldownLog,
  type RolldownWatcher,
  type RolldownWatcherEvent,
  type RolldownOptions,
} from 'rolldown'
import type { CompileOpt } from '@mbler/mcx-types'
import Logger from '../logger'
import { fileExists, join, showText } from '../utils'
import type { BuildCacheManager } from './cache'
import type { MblerBuildConfig, MblerConfigData } from '../types'
import type { OutDirs, SourceDirs } from './dirs'

export interface RollupBuildContext {
  currentConfig: MblerConfigData
  baseBuildDir: string
  srcDirs: SourceDirs
  outdirs: OutDirs
  buildConfig: Partial<MblerBuildConfig> | null
  cacheManager: BuildCacheManager | null
}

function resolveScriptOutput(
  config: MblerConfigData,
  buildConfig: Partial<MblerBuildConfig> | null
): string {
  let output = config.script?.main
  if (!output) output = 'index.js'
  if (path.extname(output) !== 'js') {
    output = output.slice(0, output.length - path.extname(output).length) + '.js'
  }
  if (buildConfig?.outputFilename) output = buildConfig.outputFilename
  return output
}

/**
 * Create (but do not write) the rolldown bundle for the project's script.
 * Returns the plugins array so watchers can re-use it, plus the build handle.
 */
export async function createRollupBuild(
  ctx: RollupBuildContext
): Promise<{ plugins: Plugin[]; build?: RolldownBuild }> {
  const { currentConfig, srcDirs, outdirs, buildConfig } = ctx
  if (!currentConfig.script) return { plugins: [] }
  const main = path.join(srcDirs.behavior, 'scripts', currentConfig.script.main)
  if (!(await fileExists(main))) {
    throw new Error(`[build addon]: main script not found: ${main}`)
  }
  const plugin: Plugin[] = []
  const moduleDir = path.join(ctx.baseBuildDir, 'node_modules')
  if (!(await fileExists(moduleDir))) {
    throw new Error(`[build addon]: node_modules not found: ${moduleDir}`)
  }
  if (currentConfig.minify) {
    if (
      !['oxc', 'terser', 'esbuild', 'none', undefined].includes(
        currentConfig.minify
      )
    ) {
      throw new TypeError(
        'ERR: [mbler]: mbler.config.js include invalid minify option: ' +
          currentConfig.minify
      )
    }
    if (currentConfig.minify === 'terser') {
      // terser (need install terser in user's project)
      plugin.push(require('./minify').terserPlugin(ctx.baseBuildDir))
    } else if (currentConfig.minify === 'esbuild') {
      // esbuild (need install esbuild in user's project)
      plugin.push(require('./minify').esbuildPlugin(ctx.baseBuildDir))
    }
    // (minify: oxc) handle at write option, (minify: none) skip minify
  }
  if (buildConfig?.rollupPlugins) {
    plugin.push(...buildConfig.rollupPlugins)
  }
  if (currentConfig.script?.lang == 'mcx') {
    try {
      const tsconfigPath = path.join(ctx.baseBuildDir, 'tsconfig.json')
      if (!(await fileExists(tsconfigPath))) {
        throw new Error(`[build addon]: tsconfig.json not found: ${tsconfigPath}`)
      }
      const pluginConfig: CompileOpt = {
        moduleDir: moduleDir,
        tsconfigPath: tsconfigPath,
        sourcemap: false,
        ts: await import('typescript')
      }
      const mcxCore = require('@mbler/mcx-core')
      // @mbler/mcx-core >= 1.1.5-dev.1 requires the host to inject the fs module
      mcxCore.setGlobalFS(require('node:fs'))
      plugin.push(mcxCore.rolldownPlugin(pluginConfig, outdirs))
    } catch (err) {
      throw new Error(
        `[build addon]: mcx plugin is required but '@mbler/mcx-core' could not be loaded: ${err}`,
        { cause: err }
      )
    }
  }
  const rollupOption: RolldownOptions = {
    input: main,
    external: [
      '@minecraft/server',
      '@minecraft/server-ui',
      ...(buildConfig?.rollupExternal ?? [])
    ],
    plugins: plugin,
    experimental: {
      ...(ctx.cacheManager?.shouldUseIncrementalBuild()
        ? { incrementalBuild: true }
        : {})
    }
  }
  if (buildConfig?.onWarn) {
    const onWarn: (
      warning: RolldownLog | string,
      defaultHandler: (warning: string | (() => string)) => void
    ) => void = (warning, _defaultHandler) => {
      const msg =
        typeof warning === 'string' ? warning : warning.message || 'Unknown warning'
      buildConfig.onWarn?.(currentConfig, new Error(msg))
    }
    rollupOption.onwarn = onWarn
  }
  if (buildConfig?.onEnd) {
    plugin.push({
      name: 'build-end-plugin',
      buildEnd: () => {
        return buildConfig.onEnd?.(currentConfig)
      }
    })
  }
  const buildBundle = require('rolldown').rolldown
  return { plugins: plugin, build: await buildBundle(rollupOption) }
}

/** Start a rolldown watch session re-using the plugins built by {@link createRollupBuild}. */
export async function createRollupWatch(
  ctx: RollupBuildContext,
  plugin: Plugin[],
  onRebuild?: () => void
): Promise<RolldownWatcher> {
  const { currentConfig, srcDirs, outdirs, buildConfig } = ctx
  const output = resolveScriptOutput(currentConfig, buildConfig)
  const outputDir = buildConfig?.outputDir || 'scripts'
  const outputOptions: Record<string, unknown> = {
    file: join(path.join(outdirs.behavior, outputDir), output),
    format: 'esm',
    sourcemap: false
  }
  if (currentConfig.minify === 'oxc') {
    outputOptions.minify = true
  }
  const rolldownWatch = require('rolldown').watch
  const rollupWatcher = rolldownWatch({
    input: path.join(srcDirs.behavior, 'scripts', currentConfig.script?.main || ''),
    external: [
      '@minecraft/server',
      '@minecraft/server-ui',
      ...(buildConfig?.rollupExternal ?? [])
    ],
    plugins: plugin,
    experimental: {
      ...(ctx.cacheManager?.shouldUseIncrementalBuild()
        ? { incrementalBuild: true }
        : {})
    },
    output: outputOptions,
    watch: {
      clearScreen: false,
      include: path.join(srcDirs.behavior, 'scripts/**/*').replace(/\\/g, '/'),
      exclude: [
        path.join(ctx.baseBuildDir, 'node_modules/**/*').replace(/\\/g, '/'),
        path.join(ctx.baseBuildDir, '.git/**/*').replace(/\\/g, '/'),
        outdirs.behavior.replace(/\\/g, '/'),
        outdirs.resources.replace(/\\/g, '/'),
        outdirs.dist.replace(/\\/g, '/')
      ]
    } as Record<string, unknown>
  })
  rollupWatcher.on('change', async (filePath: string) => {
    Logger.i('Watcher', `file changed: ${filePath}, start rebuild`)
  })
  rollupWatcher.on('event', async (event: RolldownWatcherEvent) => {
    if (event.code === 'ERROR') {
      Logger.e('Watcher', `rollup error: ${event.error.stack || event.error}`)
      showText(
        'MBLER__ERR__ROLLUP: ' +
          (event.error.stack || event.error) +
          ' Log at ' +
          Logger.LogFile
      )
    } else if (event.code === 'END') {
      Logger.i('Watcher', `rebuild success`)
      onRebuild?.()
    } else if (event.code === 'BUNDLE_END') {
      // rolldown handles incremental build internally
    }
  })
  return rollupWatcher as RolldownWatcher
}
