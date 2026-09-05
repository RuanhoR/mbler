import { watch as chokidarWatch } from 'chokidar'
import * as fs from 'node:fs/promises'
import path, { isAbsolute } from 'node:path'
import {
  type Plugin,
  type RolldownBuild,
  type RolldownWatcher,
} from 'rolldown'
import { onEnd } from '../commander'
import Logger from '../logger'
import type { ManifestData, MblerBuildConfig, MblerConfigData } from '../types'
import {
  fileExists,
  join,
  ReadProjectMblerConfig,
  showText,
  writeJSON
} from '../utils'
import { styleText } from 'node:util'
import { BuildConfig } from './config'
import { Progress } from './progress'
import { BuildCacheManager } from './cache'
import { generateArchives } from './archive'
import { DevWsServer } from './devWsServer'
import { copyIncludedEntries, safeCopy, ensureLanguagesJson, validateAndCopyChangedFile } from './copy'
import { resolveOutDirs, resolveSourceDirs } from './dirs'
import {
  createRollupBuild,
  createRollupWatch,
  isScriptSourceFile,
  transformScripts,
  type RollupBuildContext
} from './rollup'

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
  constructor(
    config: MblerConfigData,
    private baseBuildDir: string,
    private resolve: (a: number) => void,
    private isWatch: boolean = false
  ) {
    this.currentConfig = config
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
  private devWs: DevWsServer | null = null
  /**
   * Which modules are present in the current project.
   * - "behavior" when only behavior code exists
   * - "resources" when only resource files exist
   * - "all" when both are present
   * This field is populated during `handlerOtherAddon`.
   */
  public module: 'behavior' | 'resources' | 'all' | null = null
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
    if (!this.currentConfig) {
      throw new TypeError('[mbler Builder]: cannot load config')
    }
    const buildStart = performance.now()
    const progress = new Progress(100)
    this.init = true
    if (!isAbsolute(this.baseBuildDir)) {
      throw new Error('[init build]: build dir is not absolute path')
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
    await this.loadData()
    // batch exec
    if (this.buildConfig?.clean !== false && this.outdirs) {
      await Promise.all([
        fs.rm(this.outdirs.behavior, { recursive: true, force: true }),
        fs.rm(this.outdirs.resources, { recursive: true, force: true }),
      ])
    }
    await this.handlerOtherAddon()
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
        const writeOptions: Record<string, unknown> = {
          file: join(path.join(this.outdirs.behavior, 'scripts'), output),
          format: 'esm',
          sourcemap: false,
        }
        if (this.currentConfig.minify === 'oxc') {
          writeOptions.minify = true
        }
        await rBuild.write(writeOptions)
      } else {
        // bundle: false – run each script file through rolldown on its own
        // (transpile TS/mcx + minify) instead of bundling or plain copying
        await transformScripts(this.rollupCtx())
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
    const archiveConfig = this.currentConfig.archive
    if (archiveConfig?.enabled && archiveConfig?.autoGenerate) {
      const { behavior, resources } = this.outdirs
      for (const packDir of [behavior, resources]) {
        await generateArchives(packDir, archiveConfig)
      }
    }
    if (process.env.BUILD_MODULE == 'release') {
      const { generateRelease } = await import('./release')
      await generateRelease({
        outdirs: this.outdirs,
        module: this.module,
      })
    }
    if (!this.isWatch) {
      progress.update(100)
      if (this.isDebug) {
        console.debug(
          `[mbler DEBUG]: success build. build usage time: ${performance.now() - buildStart}ms`
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
  private rollupCtx(): RollupBuildContext {
    if (!this.currentConfig || !this.srcDirs || !this.outdirs)
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    return {
      currentConfig: this.currentConfig,
      baseBuildDir: this.baseBuildDir,
      srcDirs: this.srcDirs,
      outdirs: this.outdirs,
      buildConfig: this.buildConfig,
      cacheManager: this.cacheManager
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
    if (!this.currentConfig) {
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    }
    if (!this.currentConfig.script) return
    const ctx = this.rollupCtx()
    const { plugins, build } = await createRollupBuild(ctx)
    // save plugin array for watcher re-use
    this.rollupPlugin = plugins
    return build
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
    if (!this.rollupPlugin)
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    return await createRollupWatch(this.rollupCtx(), this.rollupPlugin, () => {
      if (this.devWs) {
        this.devWs.onBuildComplete(['scripts/rebuild'])
      }
    })
  }

  /** Serialises watch-mode file processing to prevent concurrent fs races. */
  private changeQueue: Promise<void> = Promise.resolve()
  /** Batch timer for debouncing rapid file events (git checkout, branch switch). */
  private pendingChanges: Set<string> = new Set()
  private debounceTimer: ReturnType<typeof setTimeout> | null = null

  private enqueueChange(filePath: string): void {
    this.pendingChanges.add(filePath)
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
    this.debounceTimer = setTimeout(() => {
      const batch = [...this.pendingChanges]
      this.pendingChanges.clear()
      if (batch.length === 0) return
      this.changeQueue = this.changeQueue
        .then(() => this.processBatch(batch))
        .catch(e => {
          Logger.e('Watcher', `batch error: ${e instanceof Error ? e.stack : e}`)
          showText(
            `[${styleText('yellow', 'mbler')}] warning: batch copy error — see log`
          )
        })
    }, 50)
  }

  private async processBatch(files: string[]): Promise<void> {
    let rebuildScripts = false
    for (const filePath of files) {
      try {
        if (await this.onChange(filePath)) rebuildScripts = true
      } catch (e) {
        // isolate per-file failures so one bad file doesn't kill the watcher
        Logger.e('Watcher', `error processing ${filePath}: ${e instanceof Error ? e.message : e}`)
      }
    }
    if (rebuildScripts) {
      try {
        // bundle: false – script sources are handled by a full rolldown
        // transform pass, so a batch of changes triggers a single rebuild
        await transformScripts(this.rollupCtx())
        this.devWs?.onBuildComplete(['scripts/rebuild'])
      } catch (e) {
        Logger.e('Watcher', `scripts rebuild error: ${e instanceof Error ? e.stack : e}`)
      }
    }
  }

  /**
   * Handle a single watched file change.
   * Returns true when the change requires a bundle:false scripts rebuild.
   */
  private async onChange(filePath: string): Promise<boolean> {
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
    const isScriptsDir =
      !isBundle && this.isParent(path.join(this.srcDirs.behavior, 'scripts'), filePath)
    const isScriptSrcChange = isScriptsDir && isScriptSourceFile(filePath)
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
      await this.loadData()
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
          await transformScripts(this.rollupCtx())
        }
      }
    }
    // if bundle: false, non-script assets inside scripts/ are copied as-is;
    // script sources are rebuilt in bulk after the batch (see processBatch)
    if (isScriptsDir && !isScriptSrcChange) {
      const relativePath = path.relative(
        path.join(this.srcDirs.behavior, 'scripts'),
        filePath
      )
      await safeCopy(
        filePath,
        path.join(this.outdirs.behavior, 'scripts', relativePath)
      )
    }
    // if behavior or resources change, validate + copy the changed file
    if (isBehaviorChange) {
      await validateAndCopyChangedFile(
        this.srcDirs.behavior,
        this.outdirs.behavior,
        filePath,
        'behavior'
      )
    }
    if (isResourcesChange) {
      await validateAndCopyChangedFile(
        this.srcDirs.resources,
        this.outdirs.resources,
        filePath,
        'resources'
      )
    }
    showText(
      `[${styleText('green', 'mbler')}] ${styleText('bgYellow', `file changed: ${filePath}`)}`
    )
    if (isScriptSrcChange) return true
    if (this.devWs) {
      this.devWs.onBuildComplete([filePath])
    }
    return false
  }
  private async createWatcher() {
    const isBundle = this.currentConfig?.build?.bundle !== false
    if (!this.srcDirs || !this.outdirs || (isBundle && !this.rollupPlugin))
      throw new Error(
        `[build addon]: internal error: called before initialization`
      )
    // Only watch what actually affects the build: the config file,
    // package.json and the behavior/resources source trees.  Watching the
    // whole project root made chokidar report unrelated paths (dist, caches,
    // editor temp files) and triggered spurious copy attempts.
    const chokidar = chokidarWatch(
      [
        path.join(this.baseBuildDir, BuildConfig.ConfigFile),
        path.join(this.baseBuildDir, 'package.json'),
        this.srcDirs.behavior,
        this.srcDirs.resources
      ],
      {
        ignored: [
          this.outdirs.behavior,
          this.outdirs.resources,
          this.outdirs.dist,
          '**/node_modules/**',
          '**/.git/**'
        ],
        ignoreInitial: true,
        interval: 100
      }
    )
    const onChange = (filePath: string) => {
      this.enqueueChange(filePath)
    }
    chokidar.on('change', onChange)
    chokidar.on('add', onChange)
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

    const devWsEnabled = this.buildConfig?.devWs === true
    if (devWsEnabled) {
      this.devWs = new DevWsServer(this.buildConfig?.devWsPort ?? 19145)
      this.devWs.start()
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
    const generateManifest = (await import('./manifest')).default
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

  private async loadData() {
    // check run time
    if (!this.currentConfig || !this.baseBuildDir)
      throw new Error('[build data]: already initialized')
    this.srcDirs = resolveSourceDirs(this.baseBuildDir)
    this.outdirs = await resolveOutDirs(this.currentConfig, this.baseBuildDir)
  }

  /**
   * Copy the various files (behavior/resources) into the corresponding
   * output directories and determine which modules exist in the project
   * by inspecting the source directories.
   */
  private async handlerOtherAddon() {
    if (!this.srcDirs || !this.outdirs)
      throw new Error(
        '[build addon]: internal error: called before initialization'
      )
    const isHasBp = await fileExists(this.srcDirs.behavior)
    if (!isHasBp)
      throw new Error('[build addon]: behavior source directory not found')
    const tasks: Promise<void>[] = []
    if (await fileExists(this.srcDirs.behavior)) {
      this.module = 'behavior'
      tasks.push(
        copyIncludedEntries(
          this.srcDirs.behavior,
          this.outdirs.behavior,
          'behavior'
        ).then(() => ensureLanguagesJson(this.outdirs!.behavior))
      )
    }
    if (await fileExists(this.srcDirs.resources)) {
      if (this.module == 'behavior') {
        this.module = 'all'
      } else {
        this.module = 'resources'
      }
      tasks.push(
        copyIncludedEntries(
          this.srcDirs.resources,
          this.outdirs.resources,
          'resources'
        ).then(() => ensureLanguagesJson(this.outdirs!.resources))
      )
    }
    if (!this.module) {
      throw new Error(
        "[build addon]: couldn't resolve source code (your behavior or resources code is not found)"
      )
    }
    await Promise.all(tasks)
  }
}
function build(config: MblerConfigData, work: string): Promise<number> {
  return new Promise<number>((resolve) => {
    new Build(config, work, resolve).start()
  })
}
function watch(config: MblerConfigData, work: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    try {
      const build = new Build(config, work, resolve, true)
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
