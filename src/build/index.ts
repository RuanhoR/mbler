import { watch as chokidarWatch } from 'chokidar'
import * as fs from 'node:fs/promises'
import path, { isAbsolute } from 'node:path'
import {
  type Plugin,
  type RolldownLog,
  type RolldownWatcherEvent,
  type RolldownOptions,
  type RolldownBuild,
  type RolldownWatcher,
} from 'rolldown'
import { onEnd } from '../commander'
import Logger from '../logger'
import type {
  CliParam,
  ManifestData,
  MblerBuildConfig,
  MblerConfigData,
} from '../types'
import {
  fileExists,
  join,
  ReadProjectMblerConfig,
  showText,
  writeJSON,
} from '../utils'
import { BuildConfig } from './config'
import { Progress } from './progress'
import type { CompileOpt } from '@mbler/mcx-types'
import { styleText } from 'node:util'
import type { LanguagePlugin } from '@volar/language-core'
import { BuildCacheManager } from './cache'

class Build {
  currentConfig: MblerConfigData | null = null
  srcDirs:
    | {
        [key in 'behavior' | 'resources']: string
      }
    | null = null
  outdirs:
    | {
        [key in 'behavior' | 'resources' | 'dist']: string
      }
    | null = null
  mcxLanguagePluginCreator:
    | ((ts: typeof import('typescript')) => LanguagePlugin<unknown>)
    | null = null
  constructor(
    opts: Record<string, string>,
    private baseBuildDir: string,
    private resolve: (a: number) => void,
    private isWatch: boolean = false
  ) {
    if (this.isDebug) {
      const { performance } = require('perf_hooks')
      const Module = require('module')
      const originalRequire = Module.prototype.require
      Module.prototype.require = function (id: string) {
        const isCached = !!Module._cache[id]
        const start = performance.now()
        const result = originalRequire.call(this, id)
        const duration = performance.now() - start

        const status = isCached ? '🔄 CACHED' : '📦 FIRST'
        if (duration > 5) {
          console.log(
            `[mbler Module load DEBUG]: ${status} [${duration.toFixed(2)}ms] ${id}`
          )
        }

        return result
      }
    }
  }
  /**
   * Start the watch mode.
   * This will perform an initial build (if not already done) and then
   * start filesystem and rollup watchers.
   * Returns the watcher handles once they are created so that callers
   * (for example tests) can clean them up later.
   */
  public async watch() {
    try {
      onEnd(() => {
        if (this.watchers) {
          this.watchers.chokidar.close()
          this.watchers.rollup?.close()
        }
      })
      await this._watch()
    } catch (e) {
      if (e instanceof Error) {
        Logger.e('Watcher', e.stack || e.message)
      } else {
        Logger.e('Watcher', e + '')
      }
      showText('MBLER__ERR__WATCHER: ' + e + ' Log at ' + Logger.LogFile)
      this.resolve(1)
      return null
    }
  }

  public async start() {
    try {
      return await this.build()
    } catch (e) {
      if (e instanceof Error) {
        Logger.e('Build', e.stack || e.message)
      } else {
        Logger.e('Build', e + '')
      }
      showText(
        'MBLER__ERR__BUILD: ' + (e as Error).stack + ' Log at ' + Logger.LogFile
      )
      this.resolve(1)
    }
  }
  /**
   * Handles returned from the currently-active watchers.
   * Set by {@link createWatcher} and exposed via {@link getWatchers}
   * so that external callers can close them when necessary (e.g. tests).
   */
  private watchers: {
    rollup: RolldownWatcher | null
    chokidar: ReturnType<typeof chokidarWatch>
  } | null = null

  /**
   * Returns the watcher handles if watch mode has been started.
   * Can be safely called even before `watch()` has been invoked.
   */
  public getWatchers() {
    return this.watchers
  }

  /**
   * Close any active watchers.  The build process does not automatically
   * terminate the watchers unless the process exits; tests or CLI wrappers
   * can call this method to clean up resources.
   */
  public closeWatchers() {
    if (this.watchers) {
      this.watchers.chokidar.close()
      this.watchers.rollup?.close()
      this.watchers = null
    }
  }
  private isDebug = process.env.DEBUG == 'true'
  private rollupPlugin: Plugin[] | null = null
  private cacheManager: BuildCacheManager | null = null
  public init: boolean = false
  private buildConfig: Partial<MblerBuildConfig> | null = null
  /**
   * Which modules are present in the current project.
   * - "behavior" when only behavior code exists
   * - "resources" when only resource files exist
   * - "all" when both are present
   * This field is populated during `handlerOtherAddon`.
   */
  public module: 'behavior' | 'resources' | 'all' | null = null
  /**
   * Determine whether a path refers to a regular file or a directory.
   * Follows symbolic links recursively.  Throws if the path exists but
   * is not one of the expected types.
   *
   * @param filePath file system path to inspect
   * @returns "file" or "directory"
   */
  private async fileType(filePath: string): Promise<'file' | 'directory'> {
    const stat = await fs.lstat(filePath)
    if (stat.isFile()) {
      return 'file'
    }
    if (stat.isDirectory()) {
      return 'directory'
    }
    if (stat.isSymbolicLink()) {
      return await this.fileType(await fs.readlink(filePath))
    }
    throw new Error('[build addon]: invalid file type')
  }
  /**
   * Perform a single build of the project located at {@link baseBuildDir}.
   * The process is roughly:
   * 1. load and validate the configuration file
   * 2. prepare source and output directory information
   * 3. copy addon files (behavior/resources)
   * 4. generate manifest.json files
   * 5. run rollup to bundle any script entry point
   *
   * If anything goes wrong the promise returned by the public wrapper
   * (`build()` function exported at the bottom of this file) will be
   * resolved with a non-zero code and appropriate log entries will be
   * emitted.
   */
  private async build() {
    const buildStart = performance.now()
    const progress = new Progress(100)
    this.init = true
    if (!isAbsolute(this.baseBuildDir)) {
      throw new Error('[init build]: build dir is not absolute path')
    }
    /**
     * on debug, show config load time
     * This is for debug.
     */
    if (this.isDebug) {
      const t0 = performance.now()
      this.currentConfig = await ReadProjectMblerConfig(this.baseBuildDir)
      console.debug(
        `[mbler DEBUG] config loaded in ${(performance.now() - t0).toFixed(2)}ms`
      )
    } else {
      this.currentConfig = await ReadProjectMblerConfig(this.baseBuildDir)
    }
    // save user build config
    if (this.currentConfig.build) this.buildConfig = this.currentConfig.build
    // init cache
    this.cacheManager = new BuildCacheManager(
      this.baseBuildDir,
      this.buildConfig?.cache,
      this.buildConfig?.cachePath
    )
    if (this.isDebug) {
      console.debug(
        `[mbler DEBUG]: init cache: cache mode: ${this.cacheManager.getMode()}`
      )
    }
    // run onStart hook
    if (this.buildConfig?.onStart)
      await this.buildConfig.onStart(this.currentConfig)
    // load data
    this.loadData()
    // batch exec
    await Promise.all([
      () => {
        if (this.buildConfig?.clean !== false && this.outdirs) {
          return Promise.all([
            fs.rm(this.outdirs.behavior, { recursive: true, force: true }),
            fs.rm(this.outdirs.resources, { recursive: true, force: true }),
          ])
        }
      },
      this.handlerOtherAddon(),
    ])
    if (!this.isWatch) {
      progress.update(10)
      if (this.isDebug) {
        console.debug(
          `[mbler DEBUG]: success build 10%. usage time: ${performance.now() - buildStart}ms`
        )
      }
    }
    await this.handlerManifest()
    if (!this.isWatch) {
      progress.update(30)
      if (this.isDebug) {
        console.debug(
          `[mbler DEBUG]: success build 30%. usage time: ${performance.now() - buildStart}ms`
        )
      }
    }
    const isBundle = this.currentConfig.build?.bundle !== false

    if (this.currentConfig.script) {
      if (isBundle) {
        const rBuild = (await this.createRollup()) as RolldownBuild
        if (!this.rollupPlugin || !this.outdirs) {
          throw new Error(`[build addon]: rollup instance not available`)
        }
        if (!this.isWatch) {
          progress.update(50)
          if (this.isDebug) {
            console.debug(
              `[mbler DEBUG]: success build 50%. usage time: ${performance.now() - buildStart}ms`
            )
          }
        }
        // write script
        let output = this.currentConfig.script?.main
        if (!output) output = 'index.js'
        if (path.extname(output) !== 'js')
          output =
            output.slice(0, output.length - path.extname(output).length) + '.js'
        if (this.buildConfig?.outputFilename)
          output = this.buildConfig.outputFilename
        const outputDir = this.buildConfig?.outputDir || 'scripts'
        const writeOptions: Record<string, unknown> = {
          file: join(path.join(this.outdirs.behavior, outputDir), output),
          format: 'esm',
          sourcemap: false,
        }
        if (this.currentConfig.minify === 'oxc') {
          writeOptions.minify = true
        }
        await rBuild.write(writeOptions)
      } else {
        // bundle: false – skip rollup, copy source scripts directly
        const srcScriptDir = path.join(this.srcDirs!.behavior, 'scripts')
        const outputDir = this.buildConfig?.outputDir || 'scripts'
        const outPath = path.join(this.outdirs!.behavior, outputDir)
        if (await fileExists(srcScriptDir)) {
          await fs.cp(srcScriptDir, outPath, { recursive: true, force: true })
        }
      }
    }
    if (!this.isWatch) {
      progress.update(70)
      if (this.isDebug) {
        console.debug(
          `[mbler DEBUG]: success build 70%. usage time: ${performance.now() - buildStart}ms`
        )
      }
    }
    if (!this.outdirs || !this.module)
      throw new Error(`[build addon]: output directories not initialized`)
    if (process.env.BUILD_MODULE == 'release') {
      const generateRelease = require('./release').generateRelease
      await generateRelease({
        outdirs: this.outdirs,
        module: this.module,
      })
    }
    if (!this.isWatch) {
      progress.update(100)
      if (this.isDebug) {
        console.debug(
          `[mbler DEBUG]: success build. usage time: ${performance.now() - buildStart}ms`
        )
      }
    }
    if (!this.isWatch) {
      const elapsed = ((performance.now() - buildStart) / 1000).toFixed(2)
      showText(
        `[${styleText('green', 'mbler')}] ${styleText('green', `✓ built in ${elapsed}s`)}`
      )
      this.resolve(0)
    }
  }
  /**
   * Create and return a Rollup build instance configured for the
   * project's script.  The Rollup configuration mirrors the options
   * used by the CLI when running manual builds.
   *
   * Returns undefined if the project does not define a script section
   * (in which case nothing needs to be bundled).
   */
  private async createRollup() {
    if (!this.currentConfig || !this.srcDirs || !this.outdirs)
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    // no script handle
    if (!this.currentConfig.script) return
    // entry file path
    const main = path.join(
      this.srcDirs.behavior,
      'scripts',
      this.currentConfig.script.main
    )
    if (!(await fileExists(main))) {
      throw new Error(`[build addon]: main script not found: ${main}`)
    }
    const plugin: Plugin[] = []
    // moduleDir
    const moduleDir = path.join(this.baseBuildDir, 'node_modules')
    if (!(await fileExists(moduleDir))) {
      throw new Error(`[build addon]: node_modules not found: ${moduleDir}`)
    }
    // handle minify option
    if (this.currentConfig.minify) {
      if (
        !['oxc', 'terser', 'esbuild', undefined].includes(
          this.currentConfig.minify
        )
      ) {
        throw new TypeError(
          'ERR: [mbler]: mbler.config.js include invalid minify option: ' +
            this.currentConfig.minify
        )
      }
      if (this.currentConfig.minify === 'terser') {
        // terser (need install terser in user's project)
        plugin.push(require('./minify').terserPlugin(this.baseBuildDir))
      } else if (this.currentConfig.minify === 'esbuild') {
        // esbuild (need install esbuild in user's project)
        plugin.push(require('./minify').esbuildPlugin(this.baseBuildDir))
      }
      // (minify: oxc) handle at write option
    }
    if (this.buildConfig?.rollupPlugins) {
      // push user plugins
      plugin.push(...this.buildConfig.rollupPlugins)
    }
    if (this.currentConfig.script?.lang == 'mcx') {
      // mcx dsl plugin handle
      try {
        const tsconfigPath = path.join(this.baseBuildDir, 'tsconfig.json')
        if (!(await fileExists(tsconfigPath))) {
          throw new Error(
            `[build addon]: tsconfig.json not found: ${tsconfigPath}`
          )
        }
        const pluginConfig: CompileOpt = {
          moduleDir: moduleDir,
          tsconfigPath: tsconfigPath,
          sourcemap: false,
          ts: await import('typescript'),
        }
        if (this.mcxLanguagePluginCreator) {
          pluginConfig.mcxLanguagePlugin = this.mcxLanguagePluginCreator
        }
        const rolldownPlugin = require('@mbler/mcx-core').rolldownPlugin
        plugin.push(rolldownPlugin(pluginConfig, this.outdirs!))
      } catch (err) {
        throw new Error(
          `[build addon]: mcx plugin is required but '@mbler/mcx-core' could not be loaded: ${err}`,
          { cause: err }
        )
      }
    }
    // save plugin array for watcher re-use
    this.rollupPlugin = plugin
    const rollupOption: RolldownOptions = {
      input: main,
      external: [
        '@minecraft/server',
        '@minecraft/server-ui',
        ...(this.buildConfig?.rollupExternal ?? []),
      ],
      plugins: plugin,
      experimental: {
        ...(this.cacheManager?.shouldUseIncrementalBuild()
          ? { incrementalBuild: true }
          : {}),
      },
    }
    // push user hook
    if (this.buildConfig?.onWarn) {
      const onWarn: (
        warning: RolldownLog | string,
        defaultHandler: (warning: string | (() => string)) => void
      ) => void = (warning, _defaultHandler) => {
        const msg =
          typeof warning === 'string'
            ? warning
            : warning.message || 'Unknown warning'
        this.buildConfig?.onWarn?.(this.currentConfig!, new Error(msg))
      }
      rollupOption.onwarn = onWarn
    }
    if (this.buildConfig?.onEnd) {
      plugin.push({
        name: 'build-end-plugin',
        buildEnd: () => {
          return this.buildConfig?.onEnd?.(this.currentConfig!)
        },
      })
    }
    const buildBundle = require('rolldown').rolldown
    return await buildBundle(rollupOption)
  }

  /**
   * Internal helper invoked by {@link watch}.
   * Ensures a build has been run before starting the watchers.
   */
  private async _watch() {
    // init build
    if (!this.init) {
      await this.build()
    }
    await this.createWatcher()
    // watchers field is populated by createWatcher
  }

  private isParent(parent: string, dir: string): boolean {
    const relative = path.relative(parent, dir)
    return (
      !!relative && !relative.startsWith('..') && !path.isAbsolute(relative)
    )
  }

  private isChange<T extends object>(
    oldObj: T,
    newObj: T,
    checkKeys: Array<keyof T>
  ): boolean {
    for (const key of checkKeys) {
      if (
        typeof oldObj[key] === 'object' &&
        typeof newObj[key] === 'object' &&
        oldObj[key] !== null &&
        newObj[key] !== null
      ) {
        if (
          this.isChange(
            oldObj[key] as T,
            newObj[key] as T,
            Object.getOwnPropertyNames(oldObj[key]) as Array<
              keyof typeof oldObj
            >
          )
        ) {
          return true
        }
      } else if (oldObj[key] !== newObj[key]) {
        return true
      }
    }
    return false
  }

  private async createRollupWatcher() {
    if (
      !this.srcDirs ||
      !this.outdirs ||
      !this.currentConfig ||
      !this.rollupPlugin
    )
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    let output = this.currentConfig.script?.main
    if (!output) output = 'index.js'
    if (path.extname(output) !== 'js')
      output =
        output.slice(0, output.length - path.extname(output).length) + '.js'
    if (this.buildConfig?.outputFilename)
      output = this.buildConfig.outputFilename
    const outputDir = this.buildConfig?.outputDir || 'scripts'
    const outputOptions: Record<string, unknown> = {
      file: join(path.join(this.outdirs.behavior, outputDir), output),
      format: 'esm',
      sourcemap: false,
    }
    if (this.currentConfig.minify === 'oxc') {
      outputOptions.minify = true
    }
    const rolldownWatch = require('rolldown').watch
    const rollupWatcher = rolldownWatch({
      input: path.join(
        this.srcDirs.behavior,
        'scripts',
        this.currentConfig?.script?.main || ''
      ),
      external: [
        '@minecraft/server',
        '@minecraft/server-ui',
        ...(this.buildConfig?.rollupExternal ?? []),
      ],
      plugins: this.rollupPlugin!,
      experimental: {
        ...(this.cacheManager?.shouldUseIncrementalBuild()
          ? { incrementalBuild: true }
          : {}),
      },
      output: outputOptions,
      watch: {
        clearScreen: false,
        include: path.join(this.srcDirs.behavior, 'scripts/**/*'),
        exclude: [
          path.join(this.baseBuildDir, 'node_modules/**/*'),
          this.outdirs.behavior,
          this.outdirs.resources,
          this.outdirs.dist,
        ],
      } as Record<string, unknown>,
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
      } else if (event.code === 'BUNDLE_END') {
        // rolldown handles incremental build internally
      }
    })
    return rollupWatcher
  }
  private async onChange(filePath: string) {
    const isBundle = this.currentConfig?.build?.bundle !== false
    if (
      !this.srcDirs ||
      !this.outdirs ||
      !this.currentConfig ||
      (isBundle && !this.rollupPlugin) ||
      !this.watchers
    )
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    const isConfigChange =
      path.relative(
        path.join(this.baseBuildDir, BuildConfig.ConfigFile),
        filePath
      ) === ''
    const isPkgChange =
      path.relative(path.join(this.baseBuildDir, 'package.json'), filePath) ===
      ''
    const isScriptsChange =
      !isBundle &&
      this.isParent(path.join(this.srcDirs.behavior, 'scripts'), filePath)
    const isBehaviorChange =
      this.isParent(this.srcDirs.behavior, filePath) &&
      !this.isParent(path.join(this.srcDirs.behavior, 'scripts'), filePath)
    const isResourcesChange = this.isParent(this.srcDirs.resources, filePath)
    if (isConfigChange || isPkgChange) {
      const oldConfig = this.currentConfig
      Logger.i('Watcher', 'detected config change, reload config')
      this.currentConfig = await ReadProjectMblerConfig(this.baseBuildDir)
      this.buildConfig = this.currentConfig.build || null
      this.cacheManager = new BuildCacheManager(
        this.baseBuildDir,
        this.buildConfig?.cache,
        this.buildConfig?.cachePath
      )
      this.loadData()
      if (
        this.isChange(oldConfig, this.currentConfig, [
          'name',
          'version',
          'description',
          'mcVersion',
        ] as Array<keyof typeof oldConfig>)
      ) {
        await this.handlerManifest()
      }
      if (
        this.isChange(oldConfig, this.currentConfig, [
          'script',
          'outdir',
          'build',
        ])
      ) {
        const newIsBundle = this.currentConfig.build?.bundle !== false
        if (newIsBundle && this.watchers.rollup) {
          this.watchers.rollup.close()
          await this.createRollup()
          this.watchers.rollup = await this.createRollupWatcher()
        } else if (newIsBundle) {
          await this.createRollup()
          this.watchers.rollup = await this.createRollupWatcher()
        } else {
          if (this.watchers.rollup) {
            this.watchers.rollup.close()
          }
          this.watchers.rollup = null
        }
      }
    }
    // if bundle: false and a script file changed, copy it directly
    if (isScriptsChange) {
      const outputDir = this.buildConfig?.outputDir || 'scripts'
      const relativePath = path.relative(
        path.join(this.srcDirs.behavior, 'scripts'),
        filePath
      )
      await fs.cp(
        filePath,
        path.join(this.outdirs.behavior, outputDir, relativePath),
        { recursive: true, force: true }
      )
    }
    // if behavior or resources change, we can just copy the changed file instead of copy all files again.
    if (isBehaviorChange || isResourcesChange) {
      const handlerBP = async () => {
        if (!this.srcDirs || !this.outdirs)
          throw new Error(
            `[build addon]: internal error: called before initialization`
          )
        const relativePath = path.relative(this.srcDirs.behavior, filePath)
        await fs.cp(
          path.join(this.srcDirs.behavior, relativePath),
          path.join(this.outdirs.behavior, relativePath),
          {
            recursive: true,
            force: true,
          }
        )
      }
      const handlerRP = async () => {
        if (!this.srcDirs || !this.outdirs)
          throw new Error(
            `[build addon]: internal error: called before initialization`
          )
        const relativePath = path.relative(this.srcDirs.resources, filePath)
        await fs.cp(
          path.join(this.srcDirs.resources, relativePath),
          path.join(this.outdirs.resources, relativePath),
          {
            recursive: true,
            force: true,
          }
        )
      }
      if (isBehaviorChange) {
        await handlerBP()
      }
      if (isResourcesChange) {
        await handlerRP()
      }
    }
    showText(
      `[${styleText('green', 'mbler')}] ${styleText('bgYellow', `file changed: ${filePath}`)}`
    )
  }

  private async createWatcher() {
    const isBundle = this.currentConfig?.build?.bundle !== false
    if (!this.srcDirs || !this.outdirs || (isBundle && !this.rollupPlugin))
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    const chokidar = chokidarWatch(this.baseBuildDir, {
      ignored: [
        this.outdirs.behavior,
        this.outdirs.resources,
        this.outdirs.dist,
        path.join(this.baseBuildDir, 'node_modules'),
      ],
      ignoreInitial: true,
      interval: 100,
    })
    const onChange = async (filePath: string) => {
      await this.onChange(filePath)
    }
    chokidar.on('change', onChange)
    if (isBundle && this.currentConfig?.script) {
      const rollupWatcher = await this.createRollupWatcher()
      this.watchers = {
        chokidar,
        rollup: rollupWatcher,
      }
    } else {
      this.watchers = {
        chokidar,
        rollup: null,
      }
    }
  }

  private async handlerManifest() {
    if (!this.currentConfig || !this.outdirs || !this.srcDirs || !this.module)
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    const otherManifestOption: {
      behavior: ManifestData
      resources: ManifestData
    } = {
      behavior: {} as ManifestData,
      resources: {} as ManifestData,
    }
    const generateManifest = require('./manifest').default
    const loadOtherManifest = async (moduleType: 'behavior' | 'resources') => {
      const filePath = path.join(this.srcDirs![moduleType], 'manifest.json')
      if (await fileExists(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf-8')
          return JSON.parse(content) as ManifestData
        } catch (_err) {
          Logger.w('Build', `invalid manifest.json in ${moduleType}`)
        }
      }
      return {} as ManifestData
    }
    const tasks: Promise<void>[] = []
    if (this.module == 'behavior' || this.module == 'all') {
      tasks.push(
        (async () => {
          otherManifestOption.behavior = await loadOtherManifest('behavior')
          const manifest = await generateManifest(this.currentConfig!, 'data')
          await writeJSON(path.join(this.outdirs!.behavior, 'manifest.json'), {
            ...manifest,
            ...otherManifestOption.behavior,
          })
        })()
      )
    }
    if (this.module == 'resources' || this.module == 'all') {
      tasks.push(
        (async () => {
          otherManifestOption.resources = await loadOtherManifest('resources')
          const manifest = await generateManifest(
            this.currentConfig!,
            'resources'
          )
          await writeJSON(path.join(this.outdirs!.resources, 'manifest.json'), {
            ...manifest,
            ...otherManifestOption.resources,
          })
        })()
      )
    }
    await Promise.all(tasks)
  }

  private loadData() {
    // check run time
    if (!this.currentConfig || !this.baseBuildDir)
      throw new Error('[build data]: already initialized')
    // source code dir
    this.srcDirs = {
      behavior: path.join(this.baseBuildDir, BuildConfig.behavior),
      resources: path.join(this.baseBuildDir, BuildConfig.resources), // res
    }
    // output dir
    this.outdirs = {
      behavior: this.currentConfig.outdir?.behavior
        ? join(this.baseBuildDir, this.currentConfig.outdir.behavior)
        : path.join(this.baseBuildDir, 'dist/dep'),
      resources: this.currentConfig.outdir?.resources
        ? join(this.baseBuildDir, this.currentConfig.outdir.resources)
        : path.join(this.baseBuildDir, 'dist/res'),
      dist: this.currentConfig.outdir?.dist
        ? join(this.baseBuildDir, this.currentConfig.outdir.dist)
        : path.join(this.baseBuildDir, 'dist-pkg'),
    }
  }

  /**
   * Copy the various files (behavior/resources) into the corresponding
   * output directories and determine which modules exist in the project
   * by inspecting the source directories.
   */
  private async handlerOtherAddon() {
    if (!this.srcDirs)
      throw new Error(
        '[build addon]: internal error: called before initialization'
      )
    const isHasBp = await fileExists(this.srcDirs.behavior)
    if (!isHasBp)
      throw new Error('[build addon]: behavior source directory not found')
    // init copy resources
    const handlerBP = async () => {
      if (!this.srcDirs || !this.outdirs)
        throw new Error(
          '[build addon]: internal error: called before initialization'
        )
      for (const f of await fs.readdir(this.srcDirs.behavior)) {
        const fType = await this.fileType(path.join(this.srcDirs.behavior, f))
        const includeType =
          BuildConfig.includes.behavior[f] || BuildConfig.includes.public[f]
        if (includeType == fType) {
          await fs.cp(
            path.join(this.srcDirs.behavior, f),
            path.join(this.outdirs.behavior, f),
            {
              recursive: true,
              force: true,
            }
          )
        } else if (includeType == 'skip') {
          continue
        } else {
          throw new Error(
            `[build addon]: invalid file: ${path.join(this.srcDirs.behavior, f)}: type: ${fType}`
          )
        }
      }
    }
    const handlerRP = async () => {
      if (!this.srcDirs || !this.outdirs)
        throw new Error(
          '[build addon]: internal error: called before initialization'
        )
      for (const f of await fs.readdir(this.srcDirs.resources)) {
        const fType = await this.fileType(path.join(this.srcDirs.resources, f))
        const includeType =
          BuildConfig.includes.resources[f] || BuildConfig.includes.public[f]
        if (includeType == fType) {
          await fs.cp(
            path.join(this.srcDirs.resources, f),
            path.join(this.outdirs.resources, f),
            {
              recursive: true,
              force: true,
            }
          )
        } else if (includeType == 'skip') {
          continue
        } else {
          throw new Error(
            `[build addon]: invalid file: ${path.join(this.srcDirs.resources, f)}: type: ${fType}`
          )
        }
      }
    }
    const tasks: Promise<void>[] = []
    if (await fileExists(this.srcDirs.behavior)) {
      this.module = 'behavior'
      tasks.push(handlerBP())
    }
    if (await fileExists(this.srcDirs.resources)) {
      if (this.module == 'behavior') {
        this.module = 'all'
      } else {
        this.module = 'resources'
      }
      tasks.push(handlerRP())
    }
    if (!this.module) {
      throw new Error(
        "[build addon]: couldn't resolve source code (your behavior or resources code is not found)"
      )
    }
    await Promise.all(tasks)
  }
}
function build(cliParam: CliParam, work: string): Promise<number> {
  return new Promise<number>((resolve) => {
    new Build(cliParam.opts, work, resolve).start()
  })
}
function watch(cliParam: CliParam, work: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    try {
      const build = new Build(cliParam.opts, work, resolve, true)
      build.start().then(() => {
        build.watch()
        showText(
          `[${styleText('green', 'mbler')}] ${styleText('bgYellow', 'watching for file changes...')}`
        )
      })
    } catch (err) {
      if (err instanceof Error) {
        reject(`[watcher]: error ${err.stack || err.message}`)
      } else {
        reject(err)
      }
    }
  })
}
export { build, watch }
export default Build
export { Build }
export { default as Sapi } from './sapi'
export { default as McxTsc } from './plugin-mcx-tsc'
