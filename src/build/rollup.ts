import path from 'node:path'
import {
  type Plugin,
  type PreRenderedChunk,
  type RolldownBuild,
  type RolldownWatcher,
  type RolldownWatcherEvent,
  type RolldownOptions,
} from 'rolldown'
import fs from 'node:fs'
import type { CompileOpt } from '@mbler/mcx-types'
import Logger from '../logger'
import { terserPlugin, esbuildPlugin } from './minify'
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

function resolveScriptOutput(config: MblerConfigData): string {
  let output = config.script?.main
  if (!output) output = 'index.js'
  if (path.extname(output) !== 'js') {
    output = output.slice(0, output.length - path.extname(output).length) + '.js'
  }
  return output
}

const SCRIPT_SOURCE_EXTS = new Set([
  '.js',
  '.mjs',
  '.cjs',
  '.ts',
  '.mts',
  '.cts',
  '.tsx',
  '.jsx',
  '.mcx',
])
const DECLARATION_FILE_RE = /\.d\.[cm]?ts$/i

function isDeclarationFile(file: string): boolean {
  return DECLARATION_FILE_RE.test(file)
}

export function isScriptSourceFile(file: string): boolean {
  if (isDeclarationFile(file)) return false
  return SCRIPT_SOURCE_EXTS.has(path.extname(file).toLowerCase())
}

/**
 * Output name of a script file relative to the scripts dir:
 * index.ts => index.js, Event.mcx => Event.mcx.js, plain .js stays as-is.
 * Unknown extensions (assets inside scripts/) keep their original name.
 */
export function mapScriptOutputName(relPath: string): string {
  const normalized = relPath.replace(/\\/g, '/')
  const ext = path.extname(normalized).toLowerCase()
  if (!SCRIPT_SOURCE_EXTS.has(ext)) return normalized
  const base = normalized.slice(0, normalized.length - ext.length)
  return ext === '.mcx' ? `${base}.mcx.js` : `${base}.js`
}

async function collectScriptEntries(
  dir: string
): Promise<{ scripts: string[]; assets: string[] }> {
  const scripts: string[] = []
  const assets: string[] = []
  const walk = async (cur: string): Promise<void> => {
    for (const entry of await fs.promises.readdir(cur, { withFileTypes: true })) {
      const abs = path.join(cur, entry.name)
      if (entry.isDirectory()) {
        await walk(abs)
      } else if (entry.isFile()) {
        if (isDeclarationFile(entry.name)) continue
        if (isScriptSourceFile(entry.name)) {
          scripts.push(path.relative(dir, abs))
        } else {
          assets.push(path.relative(dir, abs))
        }
      }
    }
  }
  await walk(dir)
  return { scripts, assets }
}

async function collectScriptPlugins(
  ctx: RollupBuildContext,
  moduleDir: string
): Promise<Plugin[]> {
  const { currentConfig, buildConfig } = ctx
  const plugin: Plugin[] = []
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
      plugin.push(terserPlugin(ctx.baseBuildDir))
    } else if (currentConfig.minify === 'esbuild') {
      // esbuild (need install esbuild in user's project)
      plugin.push(esbuildPlugin(ctx.baseBuildDir))
    }
    // (minify: oxc) handle at write option, (minify: none) skip minify
  }
  if (buildConfig?.rollupPlugins) {
    plugin.push(...buildConfig.rollupPlugins)
  }
  if (currentConfig.script?.lang == 'mcx') {
    if (!(await fileExists(moduleDir))) {
      throw new Error(`[build addon]: node_modules not found: ${moduleDir}`)
    }
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
      const mcxCore = await import('@mbler/mcx-core')
      // @mbler/mcx-core >= 1.1.5-dev.1 requires the host to inject the fs module
      mcxCore.setGlobalFS(fs)
      plugin.push(mcxCore.rolldownPlugin(pluginConfig, ctx.outdirs))
    } catch (err) {
      throw new Error(
        `[build addon]: mcx plugin is required but '@mbler/mcx-core' could not be loaded: ${err}`,
        { cause: err }
      )
    }
  }
  if (buildConfig?.onEnd) {
    plugin.push({
      name: 'build-end-plugin',
      buildEnd: () => {
        return buildConfig.onEnd?.(currentConfig)
      }
    })
  }
  return plugin
}

function makeOnWarn(ctx: RollupBuildContext): NonNullable<RolldownOptions['onwarn']> {
  const { currentConfig, buildConfig } = ctx
  return (warning, _defaultHandler) => {
    const msg =
      typeof warning === 'string' ? warning : warning.message || 'Unknown warning'
    buildConfig?.onWarn?.(currentConfig, new Error(msg))
  }
}

/**
 * Create (but do not write) the rolldown bundle for the project's script.
 * Returns the plugins array so watchers can re-use it, plus the build handle.
 */
export async function createRollupBuild(
  ctx: RollupBuildContext
): Promise<{ plugins: Plugin[]; build?: RolldownBuild }> {
  const { currentConfig, srcDirs, buildConfig } = ctx
  if (!currentConfig.script) return { plugins: [] }
  const main = path.join(srcDirs.behavior, 'scripts', currentConfig.script.main)
  if (!(await fileExists(main))) {
    throw new Error(`[build addon]: main script not found: ${main}`)
  }
  const moduleDir = path.join(ctx.baseBuildDir, 'node_modules')
  if (!(await fileExists(moduleDir))) {
    throw new Error(`[build addon]: node_modules not found: ${moduleDir}`)
  }
  const plugin = await collectScriptPlugins(ctx, moduleDir)
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
    },
    ...(buildConfig?.onWarn ? { onwarn: makeOnWarn(ctx) } : {})
  }
  const { rolldown } = await import('rolldown')
  return { plugins: plugin, build: await rolldown(rollupOption) }
}

/**
 * bundle: false mode — instead of bundling, run every script source file
 * through rolldown on its own (TS/mcx transpile + minify) and emit one
 * output file per source file, e.g. index.ts => index.js and
 * Event.mcx => Event.mcx.js. Project-internal imports stay imports; bare
 * imports (@minecraft/server, node_modules) stay external.
 */
export async function transformScripts(ctx: RollupBuildContext): Promise<void> {
  const { currentConfig, srcDirs, outdirs, buildConfig } = ctx
  if (!currentConfig.script) return
  const scriptsDir = path.join(srcDirs.behavior, 'scripts')
  const scriptsOutDir = path.join(outdirs.behavior, 'scripts')
  const { scripts, assets } = await collectScriptEntries(scriptsDir)
  if (scripts.length === 0 && assets.length === 0) return
  const plugins = await collectScriptPlugins(
    ctx,
    path.join(ctx.baseBuildDir, 'node_modules')
  )
  const input: Record<string, string> = {}
  for (const rel of scripts) {
    input[rel.replace(/\\/g, '/')] = path.join(scriptsDir, rel)
  }
  const chunkName = (chunk: PreRenderedChunk): string => {
    if (chunk.facadeModuleId) {
      const rel = path.relative(scriptsDir, chunk.facadeModuleId)
      if (rel && !rel.startsWith('..') && !path.isAbsolute(rel)) {
        return mapScriptOutputName(rel)
      }
    }
    return mapScriptOutputName(chunk.name)
  }
  const outputOptions: Record<string, unknown> = {
    dir: scriptsOutDir,
    format: 'esm',
    sourcemap: false,
    preserveModules: true,
    preserveModulesRoot: scriptsDir,
    entryFileNames: chunkName,
    chunkFileNames: chunkName,
    minify: currentConfig.minify === 'oxc'
  }
  if (scripts.length > 0) {
    const { rolldown } = await import('rolldown')
    const bundle = await rolldown({
      input,
      external: (id, parentId) => {
        if (!id.startsWith('.') && !path.isAbsolute(id)) return true
        let abs = id
        if (!path.isAbsolute(abs)) {
          if (!parentId) return true
          abs = path.resolve(path.dirname(parentId), abs)
        }
        const rel = path.relative(scriptsDir, abs)
        return !rel || rel.startsWith('..') || path.isAbsolute(rel)
      },
      plugins,
      ...(buildConfig?.onWarn ? { onwarn: makeOnWarn(ctx) } : {})
    })
    await bundle.write(outputOptions)
  }
  // non-script files inside scripts/ (e.g. json) keep their original name
  for (const rel of assets) {
    const dest = path.join(scriptsOutDir, rel)
    await fs.promises.mkdir(path.dirname(dest), { recursive: true })
    await fs.promises.cp(path.join(scriptsDir, rel), dest, { force: true })
  }
}

/** Start a rolldown watch session re-using the plugins built by {@link createRollupBuild}. */
export async function createRollupWatch(
  ctx: RollupBuildContext,
  plugin: Plugin[],
  onRebuild?: () => void
): Promise<RolldownWatcher> {
  const { currentConfig, srcDirs, outdirs, buildConfig } = ctx
  const output = resolveScriptOutput(currentConfig)
  const outputOptions: Record<string, unknown> = {
    file: join(path.join(outdirs.behavior, 'scripts'), output),
    format: 'esm',
    sourcemap: false
  }
  if (currentConfig.minify === 'oxc') {
    outputOptions.minify = true
  }
  const { watch: rolldownWatch } = await import('rolldown')
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
