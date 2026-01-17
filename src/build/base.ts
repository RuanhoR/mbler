import fs from 'fs/promises';
import path from 'path';
import dayjs from 'dayjs';
import logger from './../loger/index.js';
import lang from './../lang/index.js';
import Temp from './../runTemp/index.js';
import { spawn } from 'child_process';
import { ManiFest } from './manifest.build.js';
import type { MblerConfigData } from './../types.js';
import type { BuildData } from './index.js';
import os from "node:os"
const time = (): string => dayjs().format('YYYY-MM-DD HH:mm:ss');

// 这里是主Build的底类，用于提供工具，主Build负责将工具连起来，进行完整的构建
export abstract class BaseBuild {
  [x: string]: any;
  static times: string = time();
  outdir: string | null = null;
  ResOutDir: string | null = null;
  baseCwd: string = '';
  cwd: string = '';
  ResCwd: string = '';
  d_data: BuildData | null = null;
  cacheDir: string = '';
  dependencies: Record<string, string> = {};
  Modules: string[] = [];

  protected constructor() { }

  async rmPackScriptScriptCache(): Promise<void> {
    await Promise.all([
      this.rmNpmDes(),
      fs.rm(path.join(this.outdir!, 'scripts/package-lock.json'), {
        recursive: true,
        force: true
      }).catch(() => { })
    ]);
  }

  async processResources(): Promise<void> {
    const utils = await import('./../utils/index.js');
    if ((await utils.FileExsit(this.ResCwd)) && this.ResOutDir) {
      await Promise.all(
        (await fs.readdir(this.ResCwd)).map((dir) =>
          utils.copy(
            path.join(this.ResCwd, dir),
            path.join(this.ResOutDir!, dir)
          )
        )
      );
      const manifest = (new ManiFest(this.d_data!, "resources")).data;
      await this.writeFile(path.join(this.ResOutDir!, "manifest.json"), JSON.stringify(manifest));
    } else {
      logger.i("Build", lang.build.no_resources);
    }
  }

  async processDist(): Promise<void> {
    const utils = await import('./../utils/index.js');
    if (process.env.MBLER_BUILD_MODULE === "dist") {
      const temp = new Temp(os.tmpdir());
      await temp.init();
      await Promise.all([
        utils.copy(this.outdir!, path.join(temp.dir, "behavior")),
        (await utils.FileExsit(this.ResCwd)) ?
          utils.copy(this.ResOutDir!, path.join(temp.dir, "resources")) :
          Promise.resolve()
      ]);
      let i = this.d_data?.outdir?.dist || "dist.mcaddon";
      if (path.extname(i) !== ".mcaddon") i += ".mcaddon";
      const dir = path.join(this.baseCwd, i);
      const v = require('./../../package.json');
      await fs.writeFile(
        path.join(temp.dir, "behavior", ".mbler.build.info"),
        JSON.stringify({
          mbler: {
            version: v.version,
            git: v.repository
          },
          time: BaseBuild.times
        })
      );
      await utils.zip([
        temp.dir
      ], dir);
      await temp.remove();
      logger.i("Build", `${lang.build.ziped} ${dir}`);
    }
  }

  async loadPackageData(): Promise<MblerConfigData> {
    const utils = await import('./../utils/index.js');
    const data = await utils.GetData(this.baseCwd);
    if (!data) throw new Error(lang.buildBase.cannot_read_project_config);
    if (typeof data !== 'object' || data === null)
      throw new Error(lang.buildBase.invalid_project_config_format);
    return data;
  }

  getCachePath(fileName: string): string {
    return path.join(this.cacheDir, fileName);
  }

  getOutputDir(dir: string | null | undefined, def: string): string {
    const outdir = dir;
    return outdir ? path.join(this.baseCwd, outdir) : def;
  }

  async initNpmDes(): Promise<void> {
    const packager = JSON.parse(await fs.readFile(path.join(this.baseCwd, 'package.json'), "utf-8")) as { dependencies?: Record<string, string> };
    const desLength = Object.keys(packager.dependencies || {}).length;
    if (desLength < 1) {
      logger.w('Build', lang.buildBase.npm_deps_skipped_no_json);
      return;
    }
    await fs.writeFile(path.join(this.outdir!, 'scripts/package.json'), JSON.stringify(packager));
    await this.#npmInstall(path.join(this.outdir!, 'scripts'));
  }

  #npmInstall(repo: string): Promise<number> {
    return new Promise((resolve, reject) => {
      logger.i('Build', lang.buildBase.starting_npm_install);
      const processC = spawn('npm', ['install'], {
        cwd: repo,
        stdio: 'ignore'
      });
      processC.on('close', (code: number) => {
        if (code === 0) {
          logger.i('Build', lang.buildBase.npm_install_completed);
          resolve(code);
        } else {
          logger.w('Build', lang.buildBase.npm_install_exit_code + code);
          resolve(code);
        }
      });
      processC.on('error', (err: Error) => {
        logger.e('npmInstall', `${lang.buildBase.npm_install_error} ${err.stack}`);
        reject(err);
      });
    });
  }

  async getFileHash(filePath: string): Promise<string | null> {
    const utils = await import('./../utils/index.js');
    if (!await utils.FileExsit(filePath)) return null;
    const content = await fs.readFile(filePath);
    const hashSum = (await import('crypto')).createHash('sha1');
    hashSum.update(content);
    return hashSum.digest('hex');
  }

  async chackConfigHash(): Promise<{
    configChanged: boolean;
    packageChanged: boolean;
  }> {
    const configPath = path.join(this.cwd, 'mbler.config.json');
    const packagePath = path.join(this.cwd, 'package.json');
    const configHashPath = this.getCachePath('config-hash.txt');
    const packageHashPath = this.getCachePath('package-hash.txt');
    const currentConfigHash = await this.getFileHash(configPath);
    const currentPackageHash = await this.getFileHash(packagePath);
    let configHashStored: string | null = null;
    let packageHashStored: string | null = null;

    if (await fs.access(configHashPath).then(() => true).catch(() => false)) {
      configHashStored = await fs.readFile(configHashPath, "utf-8");
    }
    if (await fs.access(packageHashPath).then(() => true).catch(() => false)) {
      packageHashStored = await fs.readFile(packageHashPath, "utf-8");
    }

    const configChanged = !currentConfigHash || currentConfigHash !== configHashStored;
    const packageChanged = !currentPackageHash || currentPackageHash !== packageHashStored;

    if (currentConfigHash) {
      await fs.writeFile(configHashPath, currentConfigHash);
    }
    if (currentPackageHash) {
      await fs.writeFile(packageHashPath, currentPackageHash);
    }

    return {
      configChanged,
      packageChanged
    };
  }

  async removeJsFiles(dir: string): Promise<void> {
    try {
      for (const f of await fs.readdir(dir, {
        withFileTypes: true
      })) {
        const full = path.join(dir, f.name);
        if (full.includes('node_modules')) continue;
        if (f.isDirectory()) {
          await this.removeJsFiles(full);
        } else if (f.isFile() && f.name.endsWith('.js')) {
          try {
            await fs.unlink(full);
          } catch (e) {
            /* 忽略 unlink 错误 */
          }
        }
      }
    } catch (err) { }
  }

  async rmNpmDes(): Promise<void> {
    const moduleDir = path.join(this.outdir!, 'scripts/node_modules');
    const modules = this.Modules || Object.keys(this.dependencies);
    for (let file of await fs.readdir(moduleDir).catch(() => [])) {
      if (!modules.includes(file))
        await fs.rm(path.join(moduleDir, file), {
          recursive: true,
          force: true
        }).catch(() => { });
    }
  }

  async copyCompiledOnly(srcDir: string, destDir: string): Promise<void> {
    try {
      for (const ent of await fs.readdir(srcDir, {
        withFileTypes: true
      })) {
        const srcFull = path.join(srcDir, ent.name);
        const destFull = path.join(destDir, ent.name);
        if (ent.isDirectory()) {
          await fs.mkdir(destFull, {
            recursive: true
          }).catch(() => { });
          await this.copyCompiledOnly(srcFull, destFull);
        } else if (ent.isFile()) {
          const ext = path.extname(ent.name).toLowerCase();
          if ([".js", ".json"].includes(ext)) {
            await fs.mkdir(path.dirname(destFull), {
              recursive: true
            }).catch(() => { });
            await fs.copyFile(srcFull, destFull).catch(() => {
              // 文件可能被占用，忽略单个错误
            });
          }
        }
      }
    } catch (err) {
      logger.w('Build', `ERR: ${err && (err as Error).stack ? (err as Error).stack : err}`);
    }
  }

  async getAllTsFiles(dir: string): Promise<string[]> {
    const list: string[] = [];
    try {
      for (const f of await fs.readdir(dir, {
        withFileTypes: true
      })) {
        const full = path.join(dir, f.name);
        if (f.isDirectory()) {
          const sub = await this.getAllTsFiles(full);
          list.push(...sub);
        } else if (f.isFile() && f.name.endsWith('.ts')) {
          list.push(full);
        }
      }
    } catch (err) { }
    return list;
  }

  async writeFile(filePath: string, content: string | object): Promise<void> {
    const utils = await import('./../utils/index.js');
    try {
      await utils.waitGC();
      await fs.mkdir(path.dirname(filePath), {
        recursive: true
      });
      const data = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
      await fs.writeFile(filePath, data, 'utf-8');
    } catch (err) {
      logger.e('Build', `WRITE FILE ERR: ${filePath}`, err);
      throw err;
    }
    await utils.waitGC();
  }
}