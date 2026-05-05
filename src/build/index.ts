import * as mcxDef from '@mbler/mcx-core'
import _chalk from 'chalk'
import minifyPlugin from '@rollup/plugin-terser'
import { watch as chokidarWatch } from 'chokidar'
import * as fs from 'node:fs/promises'
import path, { isAbsolute } from 'node:path'
import {
  rolldown as buildBundle, watch as rolldownWatch, type Plugin,
  type RolldownWatcherEvent, type RolldownOptions, type RolldownBuild, type RolldownWatcher
} from 'rolldown'
import { onEnd } from '../commander'
import Logger from '../logger'
import type { CliParam, ManifestData, MblerBuildConfig, MblerConfigData } from '../types'
import { FileExsit, join, ReadProjectMblerConfig, showText, writeJSON } from '../utils'
import { BuildConfig } from './config'
import { BuildCacheManager } from './cache'
import generateManifest from './manifest'
import { generateRelease } from './release'
import { Postgress } from './postgress'
import { createMCXLanguagePlugin, MCXLanguagePlugin } from '@mbler/mcx-server'
import { LanguagePlugin } from '@volar/language-core'
import type { CompileOpt } from '@mbler/mcx-types'
import typescript from '@rollup/plugin-typescript'
import ts from 'typescript'
// cjs support
const chalk = _chalk instanceof Function ? _chalk : (_chalk as unknown as typeof import("chalk")).default
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
  mcxTs: typeof import("typescript")
  mcxLanguagePluginCreator: ((ts: typeof import("typescript")) => LanguagePlugin<unknown>) | null = null;
  constructor(
    opts: Record<string, string>,
    private baseBuildDir: string,
    private resolve: (a: number) => void,
    private isWatch: boolean = false
  ) {
    try {
      const tsModule = ts;
      this.mcxLanguagePluginCreator = createMCXLanguagePlugin as unknown as typeof this.mcxLanguagePluginCreator
      this.mcxTs = tsModule
    } catch (error) {
      this.mcxTs = ts
      Logger.w("Build", `Failed to initialize MCX language plugin: ${error}`)
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
          this.watchers.rollup.close()
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
    rollup: RolldownWatcher
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
      this.watchers.rollup.close()
      this.watchers = null
    }
  }
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
    throw new Error('[build addon]: invaild file type')
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
    const progress = new Postgress(100)
    this.init = true
    if (!isAbsolute(this.baseBuildDir)) {
      throw new Error('[init build]: build dir is not absolute path')
    }
    this.currentConfig = await ReadProjectMblerConfig(this.baseBuildDir)
    if (this.currentConfig.build) this.buildConfig = this.currentConfig.build;
    this.cacheManager = new BuildCacheManager(
      this.baseBuildDir,
      this.buildConfig?.cache,
      this.isWatch
    )
    if (this.buildConfig?.onStart) await this.buildConfig.onStart(this.currentConfig);
    this.loadData()
    if (!this.isWatch) progress.update(10)
    await this.handlerOtherAddon()
    await this.handlerManifest()
    if (!this.isWatch) progress.update(30)
    const rBuild = (await this.createRollup()) as RolldownBuild
    if (!this.rollupPlugin || !this.outdirs) {
      throw new Error(`[build addon]: can't resolve rollup instance`)
    }
    if (!this.isWatch) progress.update(50)
    // write script
    let output = this.currentConfig.script?.main;
    if (!output) output = "index.js"
    if (path.extname(output) !== "js") output = output.slice(0, output.length - path.extname(output).length) + ".js";
    if (this.currentConfig.script)
      await rBuild.write(this.currentConfig.build?.bundle ? {
        file: join(path.join(this.outdirs.behavior, "scripts"), output),
        format: 'esm',
        sourcemap: false,
      } :
        {
          dir: path.join((this.outdirs as { behavior: string }).behavior, "scripts"),
          format: 'esm',
          sourcemap: false,
          chunkFileNames: '[name].js',
        }
      )
    await this.cacheManager?.saveRollupCache((rBuild as any).cache)
    if (!this.isWatch) progress.update(70)
    if (!this.outdirs || !this.module) throw new Error(`[build addon]: can't resolve outdirs`)
    await generateRelease({
      outdirs: this.outdirs,
      module: this.module
    });
    if (!this.isWatch) progress.update(80)
    if (!this.isWatch) this.resolve(0)
    if (!this.isWatch) progress.update(100)
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
      throw new Error(`[build addon]: can't first can this method`)
    if (!this.currentConfig.script) return
    const main = path.join(
      this.srcDirs.behavior,
      'scripts',
      this.currentConfig.script.main
    )
    if (!(await FileExsit(main))) {
      throw new Error(
        `[build addon]: main script ${main} is not exist: can't resolve entry`
      )
    }
    const plugin: Plugin[] = []
    const moduleDir = path.join(this.baseBuildDir, 'node_modules')
    if (!(await FileExsit(moduleDir))) {
      throw new Error(
        `[build addon]: node_modules is not exist in project root: can't resolve node_modules for rollup: ${moduleDir}`
      )
    }
    if (this.currentConfig.minify) {
      plugin.push(
        minifyPlugin({
          format: {
            comments: false,
          },
          compress: {
            unused: true,
          },
        }) as unknown as Plugin
      )
    }
    if (this.buildConfig?.rollupPlugins) {
      plugin.push(...this.buildConfig.rollupPlugins)
    }
    if (this.currentConfig.script.lang == "ts") {
      const tsconfigPath = path.join(this.baseBuildDir, 'tsconfig.json')
      if (!(await FileExsit(tsconfigPath))) {
        throw new Error(
          `[build addon]: ts-lang: tsconfig.json is not exist in project root: can't resolve tsconfig for rollup: ${tsconfigPath}`
        )
      }
      plugin.push(typescript({
        sourceMap: false,
        tsconfig: tsconfigPath,
        exclude: [
          this.outdirs.behavior,
          this.outdirs.resources
        ],
        include: [
          this.srcDirs.behavior
        ]
      }) as unknown as Plugin)
    }
    if (this.currentConfig.script?.lang == 'mcx') {
      try {
        const tsconfigPath = path.join(this.baseBuildDir, 'tsconfig.json')
        if (!(await FileExsit(tsconfigPath))) {
          throw new Error(
            `[build addon]: ts-lang: tsconfig.json is not exist in project root: can't resolve tsconfig for rollup: ${tsconfigPath}`
          )
        }
        const pluginConfig: CompileOpt = {
          moduleDir: moduleDir,
          tsconfigPath: tsconfigPath,
          sourcemap: false,
          ts: this.mcxTs,
          mcxLanguagePlugin: this.mcxLanguagePluginCreator as any
        };
        if (this.mcxLanguagePluginCreator) {
          pluginConfig.mcxLanguagePlugin = this.mcxLanguagePluginCreator;
        }
        plugin.push(mcxDef.plugin(pluginConfig, this.outdirs) as unknown as Plugin)
      } catch (err) {
        throw new Error(
          `[build addon]: mcx plugin is required but '@mbler/mcx-core' could not be loaded: ${err}`
        )
      }
    }
    // save plugin array for watcher re-use
    this.rollupPlugin = plugin
    const rollupOption: RolldownOptions = {
      input: main,
      external: ['@minecraft/server', '@minecraft/server-ui'],
      plugins: plugin,
    };
    if (this.buildConfig?.onWarn) {
      const onWarn: (warning: any, defaultHandler: (warning: string | (() => string)) => void) => void = (warning, _defaultHandler) => {
        const msg = typeof warning === 'string' ? warning : (warning as any).message || 'Unknown warning'
        this.buildConfig?.onWarn?.(this.currentConfig!, new Error(msg))
      }
      rollupOption.onwarn = onWarn
    }
    if (this.buildConfig?.onEnd) {
      plugin.push({
        name: 'build-end-plugin',
        buildEnd: () => {
          return this.buildConfig?.onEnd?.(this.currentConfig!)
        }
      })
    }
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
    this.createWatcher()
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
            oldObj[key] as any,
            newObj[key] as any,
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

  private createRollupWatcher() {
    if (
      !this.srcDirs ||
      !this.outdirs ||
      !this.currentConfig ||
      !this.rollupPlugin
    )
      throw new Error(`[build addon]: can't first can this method`);
    let output = this.currentConfig.script?.main;
    if (!output) output = "index.js"
    if (path.extname(output) !== "js") output = output.slice(0, output.length - path.extname(output).length) + ".js";
    const rollupWatcher = rolldownWatch({
      input: path.join(
        this.srcDirs.behavior,
        'scripts',
        this.currentConfig?.script?.main || ''
      ),
      external: ['@minecraft/server', '@minecraft/server-ui'],
      plugins: this.rollupPlugin as any,
      output: this.currentConfig.build?.bundle ? {
        file: join(path.join(this.outdirs.behavior, "scripts"), output),
        format: 'esm',
        sourcemap: false,
      } : {
        dir: join(path.join(this.outdirs.behavior, "scripts"), output),
        format: 'esm',
        chunkFileNames: '[name].js',
        sourcemap: false,
      },
      watch: {
        clearScreen: false,
        include: path.join(this.srcDirs.behavior, 'scripts/**/*'),
        exclude: [
          path.join(this.baseBuildDir, 'node_modules/**/*'),
          this.outdirs.behavior,
          this.outdirs.resources,
          this.outdirs.dist,
        ],
      },
    } as any)
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
        await this.cacheManager?.saveRollupCache((event.result as any)?.cache)
      }
    })
    return rollupWatcher
  }
  private async onChange(filePath: string) {
    if (
      !this.srcDirs ||
      !this.outdirs ||
      !this.currentConfig ||
      !this.rollupPlugin ||
      !this.watchers
    )
      throw new Error(`[build addon]: can't first can this method`)
    const isConfigChange =
      path.relative(
        path.join(this.baseBuildDir, 'mbler.config.json'),
        filePath
      ) === ''
    const isBehaviorChange = this.isParent(this.srcDirs.behavior, filePath) && !this.isParent(path.join(this.srcDirs.behavior, 'scripts'), filePath)
    const isResourcesChange = this.isParent(this.srcDirs.resources, filePath)
    if (isConfigChange) {
      const oldConfig = this.currentConfig
      Logger.i('Watcher', 'detected mbler.config.json change, reload config')
      this.currentConfig = await ReadProjectMblerConfig(this.baseBuildDir)
      this.buildConfig = this.currentConfig.build || null
      this.cacheManager = new BuildCacheManager(
        this.baseBuildDir,
        this.buildConfig?.cache,
        this.isWatch
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
      if (this.isChange(oldConfig, this.currentConfig, ['script', 'outdir'])) {
        this.watchers.rollup.close()
        await this.createRollup()
        this.watchers.rollup = this.createRollupWatcher()
      }
    }
    // if behavior or resources change, we can just copy the changed file instead of copy all files again.
    if (isBehaviorChange || isResourcesChange) {
      const handlerBP = async () => {
        if (!this.srcDirs || !this.outdirs)
          throw new Error(`[build addon]: can't first can this method`)
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
          throw new Error(`[build addon]: can't first can this method`)
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
    showText(`[${chalk.green('mbler')}] ${chalk.bgYellow(`file changed: ${filePath}`)}`)
  }

  private createWatcher() {
    if (!this.srcDirs || !this.outdirs || !this.rollupPlugin)
      throw new Error(`[build addon]: can't first can this method`)
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
    const rollupWatcher = this.createRollupWatcher()
    this.watchers = {
      chokidar,
      rollup: rollupWatcher,
    }
  }

  private async handlerManifest() {
    if (!this.currentConfig || !this.outdirs || !this.srcDirs || !this.module)
      throw new Error(`[build addon]: can't first can this method`)
    const otherManifestOption: {
      behavior: ManifestData
      resources: ManifestData
    } = {
      behavior: {} as ManifestData,
      resources: {} as ManifestData,
    }
    const handlerBP = async () => {
      if (!this.outdirs || !this.currentConfig)
        throw new Error(`[build addon]: can't first can this method`)
      const manifest = await generateManifest(this.currentConfig, 'data')
      await writeJSON(path.join(this.outdirs.behavior, 'manifest.json'), {
        ...manifest,
        ...otherManifestOption.behavior,
      })
    }
    const handlerRP = async () => {
      if (!this.outdirs || !this.currentConfig)
        throw new Error(`[build addon]: can't first can this method`)
      const manifest = await generateManifest(this.currentConfig, 'resources')
      await writeJSON(path.join(this.outdirs.resources, 'manifest.json'), {
        ...manifest,
        ...otherManifestOption.resources,
      })
    }
    if (this.module == 'behavior' || this.module == 'all') {
      const filePath = path.join(this.srcDirs.behavior, 'manifest.json')
      if (await FileExsit(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf-8')
          const json = JSON.parse(content)
          otherManifestOption.behavior = json
        } catch (err) {
          Logger.w('Build', 'invalid manifest.json in behavior')
        }
      }
      await handlerBP()
    }
    if (this.module == 'resources' || this.module == 'all') {
      const filePath = path.join(this.srcDirs.resources, 'manifest.json')
      if (await FileExsit(filePath)) {
        try {
          const content = await fs.readFile(filePath, 'utf-8')
          const json = JSON.parse(content)
          otherManifestOption.resources = json
        } catch (err) {
          Logger.w('Build', 'invalid manifest.json in resources')
        }
      }
      await handlerRP()
    }
  }

  private loadData() {
    // check run time
    if (!this.currentConfig || !this.baseBuildDir)
      throw new Error("[build data]: can't resolve again")
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
      throw new Error("[build addon]: can't first can this method")
    const isHasBp = await FileExsit(this.srcDirs.behavior)
    if (!isHasBp) throw new Error("[build addon]: can't resolve behavior")
    // init copy resources
    const handlerBP = async () => {
      if (!this.srcDirs || !this.outdirs)
        throw new Error("[build addon]: can't first can this method")
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
            `[build addon]: invaild file: ${path.join(this.srcDirs.behavior, f)}: type: ${fType}`
          )
        }
      }
    }
    const handlerRP = async () => {
      if (!this.srcDirs || !this.outdirs)
        throw new Error("[build addon]: can't first can this method")
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
            `[build addon]: invaild file: ${path.join(this.srcDirs.resources, f)}: type: ${fType}`
          )
        }
      }
    }
    const tasks: Promise<void>[] = []
    if (await FileExsit(this.srcDirs.behavior)) {
      this.module = 'behavior'
      tasks.push(handlerBP())
    }
    if (await FileExsit(this.srcDirs.resources)) {
      if (this.module == 'behavior') {
        this.module = 'all'
      } else {
        this.module = 'resources'
      }
      tasks.push(handlerRP())
    }
    if (!this.module) {
      throw new Error(
        "[build addon]: couldn't resolve source code(your behaivor or reources code is not found)"
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
        showText(`[${chalk.green('mbler')}] ${chalk.bgYellow('watching for file changes...')}`)
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
export {
  default as McxTsc
} from "./plugin-mcx-tsc"
