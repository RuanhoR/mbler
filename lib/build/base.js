const fs = require('fs/promises');
const path = require('path');
const utils = require('./../utils');
const dayjs = require('dayjs');
const logger = require('./../loger');
const lang = require('./../lang')
const Temp = require('./../runTemp');
const {
  spawn
} = require('child_process');
const Manifest = require('./manifest.build.js')
const time = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
// 这里是主Build的底类，用于提供工具，主Build负责将工具连起来，进行完整的构建
module.exports = class BaseBuild {
  static times = time();

  rmPackScriptCache() {
    return Promise.all([
      this.rmNpmDes(),
      fs.rm(path.join(this.outdir, 'scripts/package-lock.json'), {
        recursive: true,
        force: true
      }).catch(() => {})
    ]);
  }
  async processResources() {
    if ((await utils.FileExsit(this.ResCwd)) && this.ResOutDir) {
      await Promise.all(
        (await fs.readdir(this.ResCwd)).map((dir) =>
          utils.copy(
            path.join(this.ResCwd, dir),
            path.join(this.ResOutDir, dir)
          )
        )
      )
      const manifest = (new Manifest(this.d_data, "resources")).data;
      await fs.writeFile(path.join(this.ResOutDir, "manifest.json"), JSON.stringify(manifest))
    } else {
      logger.i("Build", lang.build.no_resources)
    }
  }
  async processDist() {
    if (process.env.MBLER_BUILD_MODULE === "dist") {
      const temp = new Temp('./lib/data/cache',
        this.baseDir);
      await temp.init();
      const list = [
        utils.copy(this.outdir, path.join(temp.dir, "uid-behavior")),
        (await utils.FileExsit(this.ResCwd)) ? utils.copy(this.ResOutDir, path.join(temp.dir, "uid-resources")) : Promise.resolve()
      ];
      await Promise.all(list)
      let i = this.d_data.outdir.dist || "dist.mcaddon";
      if (path.extname(i) !== ".mcaddon") i += ".mcaddon";
      const dir = path.join(this.baseCwd, i)
      await utils.zip([
        temp.dir
      ], dir)
      await temp.remove()
      logger.i("Build", `${lang.build.ziped} ${dir}`)
    }
  }
  async loadPackageData() {
    const data = await utils.GetData(this.baseCwd);
    if (!data) throw new Error(lang.buildBase.cannot_read_project_config);
    if (typeof data !== 'object' || data === null)
      throw new Error(lang.buildBase.invalid_project_config_format);
    return data;
  }

  getCachePath(fileName) {
    return path.join(this.cacheDir, fileName);
  }

  getOutputDir(dir, def) {
    const outdir = dir;
    return outdir ? utils.join(this.baseCwd, outdir) : def;
  }

  async initNpmDes() {
    const packager = await utils.readFile(path.join(this.baseCwd, 'package.json'), {
      want: 'object'
    });
    const desLength = Object.keys(packager.dependencies || {}).length;
    if (desLength < 1) {
      logger.w('Build', lang.buildBase.npm_deps_skipped_no_json);
      return;
    }
    await fs.writeFile(path.join(this.outdir, 'scripts/package.json'), JSON.stringify(
      packager
    ));
    await this.#npmInstall(path.join(this.outdir, 'scripts'))
  }

  #npmInstall(repo) {
    return new Promise((resolve, reject) => {
      logger.i('Build', lang.buildBase.starting_npm_install);
      const processC = spawn('npm', ['install'], {
        cwd: repo,
        stdio: 'ignore'
      });
      processC.on('close', (code) => {
        if (code === 0) {
          logger.i('Build', lang.buildBase.npm_install_completed);
          resolve(code);
        } else {
          logger.w('Build', lang.buildBase.npm_install_exit_code + code);
          resolve(code);
        }
      });
      processC.on('error', (err) => {
        logger.e('npmInstall', `${lang.buildBase.npm_install_error} ${err.stack}`);
        reject(err);
      });
    });
  }

  async getFileHash(filePath) {
    if (!await utils.FileExsit(filePath)) return null;
    const content = await fs.readFile(filePath);
    const hashSum = require('crypto').createHash('sha1');
    hashSum.update(content);
    return hashSum.digest('hex');
  }

  async chackConfigHash() {
    const configPath = path.join(this.cwd, 'mbler.config.json');
    const packagePath = path.join(this.cwd, 'package.json');
    const configHashPath = this.getCachePath('config-hash.txt');
    const packageHashPath = this.getCachePath('package-hash.txt');
    const currentConfigHash = await this.getFileHash(configPath);
    const currentPackageHash = await this.getFileHash(packagePath);
    let configHashStored = null;
    let packageHashStored = null;
    if (await utils.FileExsit(configHashPath)) {
      configHashStored = await utils.readFile(configHashPath, {
        want: 'string'
      });
    }
    if (await utils.FileExsit(packageHashPath)) {
      packageHashStored = await utils.readFile(packageHashPath, {
        want: 'string'
      });
    }
    const configChanged = !currentConfigHash || currentConfigHash !== configHashStored;
    const packageChanged = !currentPackageHash || currentPackageHash !== packageHashStored;
    if (currentConfigHash) {
      await this.writeFile(configHashPath, currentConfigHash);
    }
    if (currentPackageHash) {
      await this.writeFile(packageHashPath, currentPackageHash);
    }

    return {
      configChanged,
      packageChanged
    };
  }

  async removeJsFiles(dir) {
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
    } catch (err) {}
  }

  async rmNpmDes() {
    const moduleDir = path.join(this.outdir, 'scripts/node_modules');
    const modules = this.Modules || Object.keys(this.dependencies);
    for (let file of await fs.readdir(moduleDir).catch(() => [])) {
      if (!modules.includes(file))
        await fs.rm(path.join(moduleDir, file), {
          recursive: true,
          force: true
        }).catch(() => {});
    }
  }

  async copyCompiledOnly(srcDir, destDir) {
    try {
      for (const ent of await fs.readdir(srcDir, {
          withFileTypes: true
        })) {
        const srcFull = path.join(srcDir, ent.name);
        const destFull = path.join(destDir, ent.name);
        if (ent.isDirectory()) {
          await fs.mkdir(destFull, {
            recursive: true
          }).catch(() => {});
          await this.copyCompiledOnly(srcFull, destFull);
        } else if (ent.isFile()) {
          const ext = path.extname(ent.name).toLowerCase();
          if ([".js", ".json"].includes(ext)) {
            await fs.mkdir(path.dirname(destFull), {
              recursive: true
            }).catch(() => {});
            await fs.copyFile(srcFull, destFull).catch(e => {
              // 文件可能被占用，忽略单个错误
            });
          }
        }
      }
    } catch (err) {
      logger.w('Build', `ERR: ${err && err.stack ? err.stack : err}`);
    }
  }

  async getAllTsFiles(dir) {
    const list = [];
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
    } catch (err) {}
    return list;
  }

  async writeFile(filePath, content) {
    try {
      await utils.waitGC();
      await fs.mkdir(path.dirname(filePath), {
        recursive: true,
        force: true
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