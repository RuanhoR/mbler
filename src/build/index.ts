import * as mcxDef from '@mbler/mcx-core'
import _chalk from 'chalk'
import jsonPlugin from '@rollup/plugin-json'
import resolvePlugin from '@rollup/plugin-node-resolve'
import minifyPlugin from '@rollup/plugin-terser'
import typescriptPlugin from '@rollup/plugin-typescript'
import { watch as chokidarWatch } from 'chokidar'
import * as fs from 'node:fs/promises'
import path, { isAbsolute } from 'node:path'
import * as rollup from 'rollup'
import { onEnd } from '../commander'
import Logger from '../logger'
import type { CliParam, MblerConfigData } from '../types'
import { FileExsit, join, ReadProjectMblerConfig, showText, writeJSON } from '../utils'
import { BuildConfig } from './config'
import generateManifest from './manifest'
import { generateRelease } from './release'
import commonjs from '@rollup/plugin-commonjs'
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
  constructor(
    opts: Record<string, string>,
    private baseBuildDir: string,
    private resolve: (a: number) => void,
    private isWatch: boolean = false
  ) { }
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
    rollup: rollup.RollupWatcher
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
  private rollupPlugin: rollup.Plugin[] | null = null
  public init: boolean = false
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
    this.init = true
    if (!isAbsolute(this.baseBuildDir)) {
      throw new Error('[init build]: build dir is not absolute path')
    }
    this.currentConfig = await ReadProjectMblerConfig(this.baseBuildDir)
    this.loadData()
    await this.handlerOtherAddon()
    await this.handlerManifest()
    const rBuild = (await this.createRollup()) as rollup.RollupBuild
    if (!this.rollupPlugin || !this.outdirs) {
      throw new Error(`[build addon]: can't resolve rollup instance`)
    }
    // write script
    let output = this.currentConfig.script?.main;
    if (!output) output = "index.js"
    if (path.extname(output) !== "js") output = output.slice(0, output.length - path.extname(output).length) + ".js";
    if (this.currentConfig.script)
      await rBuild.write({
        file: join(path.join(this.outdirs.behavior, "scripts"), output),
        format: 'esm',
        sourcemap: false,
      })
    await generateRelease(this);
    if (!this.isWatch) this.resolve(0)
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
    const plugin: rollup.Plugin[] = [
      jsonPlugin(),
      resolvePlugin({
        extensions: ['.ts', '.js', '.json'],
      }),
      commonjs()
    ]

    const moduleDir = path.join(this.baseBuildDir, 'node_modules')
    if (!(await FileExsit(moduleDir))) {
      throw new Error(
        `[build addon]: node_modules is not exist in project root: can't resolve node_modules for rollup: ${moduleDir}`
      )
    }
    if (this.currentConfig.script?.lang != 'js') {
      const tsconfigPath = path.join(this.baseBuildDir, 'tsconfig.json')
      if (!(await FileExsit(tsconfigPath))) {
        throw new Error(
          `[build addon]: ts-lang: tsconfig.json is not exist in project root: can't resolve tsconfig for rollup: ${tsconfigPath}`
        )
      }
      plugin.push(
        typescriptPlugin({
          tsconfig: tsconfigPath,
          rootDir: path.join(this.srcDirs.behavior, 'scripts'),
          outDir: path.join(this.outdirs.behavior, 'scripts'),
          include: [path.join(this.srcDirs.behavior, 'scripts/**/*')],
          exclude: [
            moduleDir,
            this.outdirs.behavior,
            this.outdirs.resources,
            this.outdirs.dist,
          ],
          sourceMap: false,
        })
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
        })
      )
    }
    if (this.currentConfig.script?.lang == 'mcx') {
      try {
        plugin.push(
          mcxDef.plugin({
            moduleDir: moduleDir
          }, this.outdirs)
        )
      } catch (err) {
        throw new Error(
          `[build addon]: mcx plugin is required but '@mbler/mcx-core' could not be loaded: ${err}`
        )
      }
    }
    // save plugin array for watcher re-use
    this.rollupPlugin = plugin
    return await rollup.rollup({
      input: main,
      external: ['@minecraft/server', '@minecraft/server-ui'],
      plugins: plugin,
    })
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
      throw new Error(`[build addon]: can't first can this method`)
    const rollupWatcher = rollup.watch({
      input: path.join(
        this.srcDirs.behavior,
        'scripts',
        this.currentConfig?.script?.main || ''
      ),
      external: ['@minecraft/server', '@minecraft/server-ui'],
      plugins: this.rollupPlugin,
      output: {
        file: path.join(
          this.outdirs.behavior,
          'scripts',
          this.currentConfig?.script?.main || ''
        ),
        format: 'esm',
        sourcemap: true,
      },
      cache: true,
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
    })
    rollupWatcher.on('change', async (filePath) => {
      Logger.i('Watcher', `file changed: ${filePath}, start rebuild`)
    })
    rollupWatcher.on('event', async (event) => {
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
        this.watchers.rollup = rollup.watch({
          input: path.join(
            this.srcDirs.behavior,
            'scripts',
            this.currentConfig?.script?.main || ''
          ),
          external: ['@minecraft/server', '@minecraft/server-ui'],
          plugins: this.rollupPlugin,
          output: {
            file: path.join(
              this.outdirs.behavior,
              'scripts',
              this.currentConfig?.script?.main || ''
            ),
            format: 'esm',
          },
        })
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
      behavior: any
      resources: any
    } = {
      behavior: {},
      resources: {},
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