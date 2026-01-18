import * as fs from 'fs/promises';
import * as path from 'path';
import * as ts from 'typescript';
import lang from './../lang/index.js';
import { mcVersionGeter } from './mcVersion.js';
import { fromString as uuidFromString } from './../uuid/index.js';
import logger from './../loger/index.js';
import minify from './../code-processor/index.js';
import * as utils from './../utils/index.js';
import getModule from './getModule.js';
import includes from './../data/includes.json';
import config from './build-g-config.json';
import Clean from './../start/clean.js';
import Temp from './../runTemp/index.js';
import { BaseBuild } from './base.js';
import { ManiFest } from './manifest.build.js';
import type { MblerConfigData } from './../types.js';
import os from "node:os"
export interface BuildData extends MblerConfigData {
  ResDes?: {
    name: string
    version: string
  }
  subpack?: Record<string, string>
  minify?: boolean;
}

interface SubpackData {
  id: string;
  title: string;
}

// 构建主类
export default class Build extends BaseBuild {
  [x: string]: any;
  baseDir: string;
  baseModDir: string;
  gamelibModule: any;
  constructor(buildPath: string, baseDir: string) {
    super();
    if (!buildPath) utils.Exit(lang.build.config_invalid);
    this.baseDir = baseDir;
    this.baseCwd = path.isAbsolute(buildPath) ?
      buildPath :
      path.join(baseDir, buildPath);
    this.cwd = path.join(this.baseCwd, "behavior");
    this.ResOutDir = null;
    this.ResCwd = path.join(this.baseCwd, "resources");
    this.dependencies = {};
    this.gamelibModule = null;
    this.baseModDir = path.join(this.baseDir, 'lib/modules');
    // 锁定属性
    this.#ObjectPri(['baseModDir', 'baseDir']);
    this.#ObjectPriEn(["outdir", "dependencies", "gamelibModule", "cwd", "ResCwd", "baseModDir", "baseCwd"]);
    this.cacheDir = path.join(this.baseCwd, '.cache__mbler__');
  }

  #ObjectPri(list: string[]): void {
    if (!Array.isArray(list)) return;
    for (let item of list) {
      Object.defineProperty(this, item, {
        enumerable: false,
        writable: false
      });
    }
  }

  // 私有：设置不可枚举属性
  #ObjectPriEn(list: string[]): void {
    if (!Array.isArray(list)) return;
    for (let item of list) {
      Object.defineProperty(this, item, {
        enumerable: false
      });
    }
  }

  // 确保缓存目录存在
  async #ensureCacheDir(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, {
        recursive: true
      });
    } catch (err) {
      // 如果目录已存在，忽略错误
      if ((err as { code?: string }).code !== 'EEXIST') {
        throw err;
      }
    }
  }

  // 构建入口
  build(): Promise<void> {
    return this.start().catch(err => {
      const errorMsg = utils.toString(err);
      logger.e('Build', lang.build.error_message_log, errorMsg);
    });
  }

  async start(): Promise<void> {
    const startTime = Date.now();
    await this.#ensureCacheDir();
    const {
      configChanged,
      packageChanged
    } = await this.chackConfigHash();
    const clean = new Clean(this.baseCwd, this.baseDir);
    await clean.run();
    await utils.waitGC();
    const data: BuildData = await this.loadPackageData();
    this.d_data = data;
    this.outdir = this.getOutputDir(data.outdir?.behavior, path.join(this.baseCwd, "dist/dep"));
    this.ResOutDir = this.getOutputDir(data.outdir?.resources, path.join(this.baseCwd, "dist/res"));
    const requiredKeys = ['name', 'description', 'version', 'mcVersion'];
    if (!utils.hasKeys(data, requiredKeys, requiredKeys.length))
      throw new Error(`${lang.build.package_file} 字段缺失：必需字段 ${JSON.stringify(requiredKeys)}`);

    this.gamelibModule = await getModule(this.baseDir);
    logger.i('Build', [
      lang.build.build_info_header,
      `${lang.build.project_path} ${this.baseCwd}`,
      `${lang.build.output_dir} ${JSON.stringify(data.outdir)}`,
      `${lang.build.minify_enabled} ${Boolean(data.minify)}`,
      `${lang.build.build_time} ${Build.times}`,
      `${lang.build.tip_dist} ${process.env.MBLER_BUILD_MODULE || "dev"}`
    ].join('\n'));
    // 并发处理资源、脚本、子包、includes
    await Promise.all([
      this.writeManifest(data),
      this.handleScripts(data),
      this.handleIncludes(),
      this.processSubpacks(data)
    ]);
    switch (data.script?.lang || "") {
      case "ts": // TypeScript 编译
        await this.compileTypeScriptUnified();
        break;
      case "mcx":
        const MCX = require("./../mcx/");
        await MCX.load({
          buildDir: path.join(this.cwd, "scripts"),
          BabelOpt: data.script || {},
          output: path.join(this.outdir!, "scripts"),
          main: path.join(this.cwd, data.script?.main || "index.js")
        });
        break;
    }
    await Promise.all([this.processMinification(data),
    // 资源包处理
    this.processResources()
    ]);
    await this.processDist();
    // 最终完成
    logger.i('Build', `${lang.build.build_success} ${(Date.now() - startTime) / 1000}`);
  }

  async writeManifest(data: BuildData): Promise<void> {
    const manifest = await this.buildManifest(data);
    await this.writeFile(path.join(this.outdir!, 'manifest.json'), manifest);
  }

  async buildManifest(data: BuildData): Promise<any> {
    const manifest = (new ManiFest(data, "data")).data;
    const subpack = data.subpack || {}
    if (typeof data.ResDes === 'object') this.processResourceDependencies(data, manifest);
    if (typeof data.subpack === 'object' && Object.keys(data.subpack).length > 0) {
      manifest.subpack = Object.keys(data.subpack).map(id => ({
        folder_name: id,
        name: subpack[id] || "",
        memory_tier: 1
      }));
    }
    return manifest;
  }

  processResourceDependencies(data: BuildData, manifest: any): void {
    const {
      name = 'unknown', version
    } = data.ResDes || {};
    if (version && utils.isVerison(version)) {
      manifest.dependencies.push({
        name: uuidFromString(name),
        version: utils.ToArray(version)
      });
    }
  }

  async handleScripts(data: BuildData): Promise<void> {
    if (!data.script || typeof data.script !== 'object') return;
    const scriptsDir = path.join(this.cwd, 'scripts');
    const outScripts = path.join(this.outdir!, 'scripts');
    if (!(await utils.FileExsit(scriptsDir))) return;
    // 复制主包脚本
    await utils.copy(scriptsDir, outScripts);
    this.dependencies = data.script.dependencies || {};
    await this.initNpmDes();
    if (Object.keys(this.dependencies).length > 0) {
      this.Modules = await this.handlerMod(this.dependencies, new Set());
    }
  }

  async processSubpacks(data: BuildData): Promise<void> {
    if (typeof data.subpack !== 'object') return;
    const outdir = this.outdir!;
    const content = new Build(this.cwd, this.baseDir);
    for (let [id, title] of Object.entries(data.subpack)) {
      try {
        const subpackPath = path.join(this.cwd, 'subpacks', id);
        const outSubpack = path.join(outdir, 'subpacks', id);
        await fs.mkdir(outSubpack, {
          recursive: true
        });
        if (!(await utils.FileExsit(subpackPath))) {
          logger.w('subpack', lang.build.subpack_folder_not_found.replace('{id}', id));
          continue;
        }
        const subScriptDir = path.join(subpackPath, 'scripts');
        const outSubScriptDir = path.join(outSubpack, 'scripts');
        if (await utils.FileExsit(subScriptDir)) {
          await utils.copy(subScriptDir, outSubScriptDir);
        }
        // 复制子包其他资源
        content.cwd = subpackPath;
        content.outdir = outSubpack;
        await content.handleIncludes();
      } catch (err) {
        logger.e('Build', lang.build.error_processing_subpack.replace('{id}', id).replace('{error}', (err as Error).stack));
      }
    }
  }

  async compileTypeScriptUnified(): Promise<void> {
    const tempMod = new Temp(os.tmpdir());
    await tempMod.init();
    const tempDir = tempMod.dir;
    try {
      const rootFiles = await this.getAllTsFiles(this.outdir!);
      if (!rootFiles || rootFiles.length === 0) {
        logger.i('Build', lang.build.ts_no_files);
        return;
      }
      const tsConfigJson = {
        compilerOptions: {
          target: "esnext",
          module: "esnext",
          moduleResolution: "NodeNext",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          outDir: tempDir,
          rootDir: this.outdir!,
          strict: true,
          allowJs: true,
          sourceMap: false,
          incremental: true, // 启用增量编译
          tsBuildInfoFile: path.join(this.cacheDir, 'tsbuildinfo') // 指定缓存文件
        },
        include: ["**/*.ts"]
      };
      const parsed = ts.parseJsonConfigFileContent(
        tsConfigJson,
        ts.sys,
        this.outdir!,
        undefined,
        "tsconfig.json"
      );
      const program = ts.createProgram({
        rootNames: rootFiles,
        options: parsed.options
      });
      const emitResult = program.emit();
      const allDiagnostics = ts
        .getPreEmitDiagnostics(program)
        .concat(emitResult.diagnostics);
      allDiagnostics.forEach(d => {
        const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        if (d.file) {
          const {
            line,
            character
          } = d.file.getLineAndCharacterOfPosition(d.start!);
          logger.w('TypeScript', lang.build.ts_diagnostics.replace('{file}', d.file.fileName).replace('{line}', (line + 1).toString()).replace('{character}', (character + 1).toString()).replace('{message}', msg));
        } else {
          logger.w('TypeScript', msg);
        }
      });
      await this.removeJsFiles(path.join(this.outdir!, 'scripts'));
      await this.copyCompiledOnly(tempDir, this.outdir!);
      logger.i("Build", lang.build.ts_compilation_error + " 完成");
    } catch (err) {
      logger.e('Build', lang.build.ts_compilation_error, err);
      throw err;
    } finally {
      await tempMod.remove();
    }
  }

  async handlerMod(modules: Record<string, string>, processed: Set<string> = new Set()): Promise<string[]> {
    const allModules = this.gamelibModule.getAll();
    const scriptOutDir = path.join(this.outdir!, 'scripts/node_modules');
    let nextDeps: Record<string, string> = {};
    for (const [packageName, gitRepo] of Object.entries(modules)) {
      if (!allModules.includes(packageName) || processed.has(packageName)) continue;
      const srcDir = await this.gamelibModule.getDir(packageName, {
        gitUrl: gitRepo,
        v: this.d_data!.mcVersion
      });
      if (!srcDir || !(await utils.FileExsit(srcDir))) continue;
      const pkg = await utils.handlerPackage(srcDir, {
        des: Array.from(processed)
      });
      if (pkg.des) Object.assign(nextDeps, pkg.des);
      await utils.copy(srcDir, path.join(scriptOutDir, packageName));
      await utils.waitGC();
      processed.add(packageName);
    }
    if (Object.keys(nextDeps).length > 0) await this.handlerMod(nextDeps, processed);
    return Array.from(processed);
  }

  handleIncludes(): Promise<void> | undefined {
    if (!Array.isArray(includes)) return;
    const copyOperations = includes
      .filter(item => typeof item === 'string')
      .map(async item => {
        const src = path.join(this.cwd, 'res', item);
        const dest = path.join(this.outdir!, item);
        if (await utils.FileExsit(src)) {
          await utils.copy(src, dest);
        }
      });
    return Promise.all(copyOperations) as unknown as Promise<void>;
  }

  async processMinification(data: BuildData): Promise<void> {
    try {
      if (!Array.isArray(includes)) {
        logger.w('Build', lang.build.includes_not_array);
        return;
      }
      await minify(
        this.outdir,
        {
          modules: this.Modules,
          sourceDir: path.join(this.outdir, 'scripts'),
          baseDir: this.baseDir,
          minify: Boolean(data.minify)}
      );
      await utils.waitGC();
    } catch (err) {
      logger.w('Build', lang.build.minification_error, err);
    }
  }
}