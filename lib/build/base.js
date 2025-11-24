const fs = require('fs/promises');
const path = require('path');
const utils = require('./../utils');
const dayjs = require('dayjs');
const logger = require('./../loger');
const time = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
// 这里是主Build的底类，用于提供工具
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
  async loadPackageData() {
    const data = await utils.GetData(this.cwd);
    if (!data) throw new Error('无法读取项目配置文件');
    if (typeof data !== 'object' || data === null)
      throw new Error('项目配置文件格式无效');
    return data;
  }
  getCachePath(fileName) {
    return path.join(this.cacheDir, fileName);
  }
  getOutputDir(data) {
    const outdir = data.outdir;
    return outdir ? utils.join(this.cwd, outdir) : path.join(this.cwd, 'dist');
  }
  async initNpmDes() {
    const packager = await utils.readFile(path.join(this.cwd, 'package.json'), {
      want: 'object'
    });
    if (Object.keys(packager).length < 3) {
      logger.w('Build', '未检测到 package.json，跳过 npm 依赖安装');
      return;
    }
    await fs.writeFile(path.join(this.outdir, 'scripts/package.json'), JSON.stringify(
      packager
    ));
    await this.npmInstall(path.join(this.outdir, 'scripts'))
  }

  npmInstall(repo) {
    return new Promise((resolve, reject) => {
      logger.i('Build', "开始安装 npm 依赖");
      const processC = spawn('npm', ['install'], {
        cwd: repo,
        stdio: 'ignore'
      });
      processC.on('close', (code) => {
        if (code === 0) {
          logger.i('Build', "依赖安装完成");
          resolve(code);
        } else {
          logger.w('Build', `npm install 退出码: ${code}`);
          resolve(code);
        }
      });
      processC.on('error', (err) => {
        logger.e('npmInstall', err);
        reject(err);
      });
    });
  }

  // 计算文件 SHA1 哈希值
  async getFileHash(filePath) {
    if (!await utils.FileExsit(filePath)) return null;
    const content = await fs.readFile(filePath);
    const hashSum = require('crypto').createHash('sha1');
    hashSum.update(content);
    return hashSum.digest('hex');
  }

  // 检查 mbler.config.json 和 package.json 是否发生变化
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
    // 保存当前哈希到缓存
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
      logger.w('Build', `复制编译产物出错: ${err && err.stack ? err.stack : err}`);
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
      logger.e('Build', `写入文件失败: ${filePath}`, err);
      throw err;
    }
    await utils.waitGC();
  }
}