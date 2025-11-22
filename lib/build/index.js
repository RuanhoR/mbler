// lib/build/index.js
const fs = require('fs/promises');
const path = require('path');
const ts = require('typescript');
const dayjs = require('dayjs');
const tip = require('./../zh_CN.js');
const {
  mcVersionGeter
} = require('./mcVersion.js');
const {
  fromString: uuidFromString
} = require('./../uuid');
const logger = require('./../loger');
const minify = require('./../code-processor');
const utils = require('./../utils');
const getModule = require('./getModule.js');
const includes = require('./../data/includes.json');
const config = require('./build-g-config.json');
const Clean = require('./../start/clean.js');
const Temp = require('./../runTemp');
const {
  spawn
} = require('child_process');

// 获取格式化时间
const time = () => dayjs().format('YYYY-MM-DD HH:mm:ss');
const isNonEmptyString = str =>
  typeof str === 'string' && str.trim().length > 0;

// 构建主类
class Build {
  static times = time();
  constructor(buildPath, baseDir) {
    if (!buildPath) utils.Exit(tip.config_invalid);
    this.baseDir = baseDir;
    this.cwd = path.isAbsolute(buildPath) ?
      buildPath :
      path.join(baseDir, buildPath);
    this.outdir = null;
    this.dependencies = [];
    this.gamelibModule = null;
    this.baseModDir = path.join(this.baseDir, 'lib/modules');
    // 锁定元素
    this.#ObjectPri(['baseModDir', 'baseDir']);
    this.#ObjectPriEn(["outdir", "dependencies", "gamelibModule", "cwd"]);
    this.cacheDir = path.join(this.cwd, '.cache__mbler__');
  }
  #ObjectPri(list) {
    if (!Array.isArray(list)) return;
    for (let item of list) {
      Object.defineProperty(this, item, {
        enumerable: false,
        writable: false
      });
    }
  }

  // 私有：设置不可枚举属性
  #ObjectPriEn(list) {
    if (!Array.isArray(list)) return;
    for (let item of list) {
      Object.defineProperty(this, item, {
        enumerable: false
      });
    }
  }

  // 获取缓存文件路径
  getCachePath(fileName) {
    return path.join(this.cacheDir, fileName);
  }

  // 确保缓存目录存在
  async #ensureCacheDir() {
    await fs.mkdir(this.cacheDir, { recursive: true, force: true });
  }

  // 计算文件 SHA1 哈希值
  async getFileHash(filePath) {
    if (!await utils.FileExsit(filePath)) return null;
    const content = await fs.readFile(filePath);
    const hashSum = require('crypto').createHash('sha1');
    hashSum.update(content);
    return hashSum.digest('hex');
  }

  // 新增：检查 mbler.config.json 和 package.json 是否发生变化
  async #checkConfigHash() {
    const configPath = path.join(this.cwd, 'mbler.config.json');
    const packagePath = path.join(this.cwd, 'package.json');
    const configHashPath = this.getCachePath('config-hash.txt');
    const packageHashPath = this.getCachePath('package-hash.txt');
    const currentConfigHash = await this.getFileHash(configPath);
    const currentPackageHash = await this.getFileHash(packagePath);
    let configHashStored = null;
    let packageHashStored = null;
    if (await utils.FileExsit(configHashPath)) {
      configHashStored = await utils.readFile(configHashPath, { want: 'string' });
    }
    if (await utils.FileExsit(packageHashPath)) {
      packageHashStored = await utils.readFile(packageHashPath, { want: 'string' });
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

    return { configChanged, packageChanged };
  }
  // 构建入口
  build() {
    return this.start().catch(err => {
      const errorMsg = utils.toString(err);
      logger.e('Build', '构建失败', errorMsg);
      process.exit(1);
    });
  }

  async start() {
    await this.#ensureCacheDir();
    const { configChanged, packageChanged } = await this.#checkConfigHash();

    const clean = new Clean(this.cwd, this.baseDir);
    await clean.run();
    await utils.waitGC();

    const data = await this.loadPackageData();
    this.outdir = this.getOutputDir(data);

    const requiredKeys = ['name', 'description', 'version', 'mcVersion'];
    if (!utils.hasKeys(data, requiredKeys, requiredKeys.length))
      throw new Error(`${config.PackageFile} 字段缺失：必需字段 ${JSON.stringify(requiredKeys)}`);

    this.gamelibModule = await getModule(this.baseDir);
    this.d_data = data;
    logger.i('Build', [
      '构建信息一览表 : ',
      `项目路径: ${this.cwd}`,
      `输出目录: ${this.outdir}`,
      `启用压缩: ${data.minify || false}`,
      `构建时间: ${Build.times}`
    ].join('\n'));
    // 并发处理资源、脚本、子包、includes
    await Promise.all([
      this.writeManifest(data),
      this.handleScripts(data),
      this.handleIncludes(),
      this.processSubpacks(data)
    ]);

    // TypeScript 编译（已含增量缓存配置）
    if (data.script?.lang === 'ts') {
      await this.compileTypeScriptUnified();
    }

    // 清理临时编译出的 js（如来自 ts）
    await utils.waitGC();
    await this.processMinification(data);

    logger.i('Build', '构建成功');
  }
  async loadPackageData() {
    const data = await utils.GetData(this.cwd);
    if (!data) throw new Error('无法读取项目配置文件');
    if (typeof data !== 'object' || data === null)
      throw new Error('项目配置文件格式无效');
    return data;
  }

  getOutputDir(data) {
    const outdir = data.outdir;
    return outdir ? utils.join(this.cwd, outdir) : path.join(this.cwd, 'dist');
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

  async writeManifest(data) {
    const manifest = await this.buildManifest(data);
    await this.writeFile(path.join(this.outdir, 'manifest.json'), manifest);
  }

  async buildManifest(data) {
    const manifest = {
      format_version: 2,
      header: {
        name: data.name,
        description: data.description,
        uuid: uuidFromString(data.name),
        version: utils.ToArray(data.version),
        min_engine_version: utils.ToArray(data.mcVersion),
      },
      modules: [{
        type: 'data',
        uuid: uuidFromString(data.name, config.DataId),
        description: `MBLER Generated @${Build.times}`,
        version: utils.ToArray(data.version),
      }],
      dependencies: []
    };

    if (typeof data.script === 'object') this.processScriptConfig(data, manifest);
    if (typeof data.ResDes === 'object') this.processResourceDependencies(data, manifest);

    if (typeof data.subpack === 'object' && Object.keys(data.subpack).length > 0) {
      manifest.subpack = Object.keys(data.subpack).map(id => ({
        folder_name: id,
        name: data.subpack[id],
        memory_tier: 1
      }));
    }

    return manifest;
  }

  processScriptConfig(data, manifest) {
    const {
      script
    } = data;
    const entry = script.main;
    if (!isNonEmptyString(entry))
      throw new Error(`${config.PackageFile} 启用了 script，但未指定 main 入口文件`);
    manifest.dependencies.push({
      module_name: '@minecraft/server',
      version: mcVersionGeter.ToServer(data.mcVersion, Boolean(script.UseBeta))
    });

    manifest.modules.push({
      type: 'script',
      language: 'javascript',
      entry: `scripts/${entry}.js`,
      uuid: uuidFromString(data.name, config.ScriptId),
      version: utils.ToArray(data.version),
    });

    if (script.ui === true) {
      manifest.dependencies.push({
        module_name: '@minecraft/server-ui',
        version: mcVersionGeter.ToServerUi(data.mcVersion, Boolean(script.UseBeta))
      });
    }

    manifest.capabilities = ['script_eval'];
  }

  processResourceDependencies(data, manifest) {
    const {
      name = 'unknown', version
    } = data.ResDes || {};
    if (utils.isVersion(version)) {
      manifest.dependencies.push({
        name: uuidFromString(name),
        version: utils.ToArray(version)
      });
    }
  }

  async handleScripts(data) {
    if (!data.script || typeof data.script !== 'object') return;
    const scriptsDir = path.join(this.cwd, 'scripts');
    const outScripts = path.join(this.outdir, 'scripts');

    if (!(await utils.FileExsit(scriptsDir))) return;
    // 复制主包脚本
    await utils.copy(scriptsDir, outScripts);
    this.dependencies = data.script.dependencies || {};
    await this.initNpmDes()
    if (Object.keys(this.dependencies).length > 0) {
      this.Modules = await this.handlerMod(this.dependencies, new Set());
    }
  }

  async processSubpacks(data) {
    if (typeof data.subpack !== 'object') return;

    const outdir = this.outdir;
    const content = new Build(this.cwd, this.baseDir);

    for (let [id, title] of Object.entries(data.subpack)) {
      try {
        const subpackPath = path.join(this.cwd, 'subpacks', id);
        const outSubpack = path.join(outdir, 'subpacks', id);
        await fs.mkdir(outSubpack, {
          recursive: true,
          force: true
        });

        if (!(await utils.FileExsit(subpackPath))) {
          logger.w('subpack', `${id} 子包文件夹不存在，打包失败`);
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
        logger.e('Build', `子包 ${id} 处理失败: ${err.stack}`);
      }
    }
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

  async compileTypeScriptUnified() {
    const tempMod = new Temp('./lib/data/cache', this.baseDir);
    await tempMod.init();
    const tempDir = tempMod.dir;
    try {
      const rootFiles = await this.getAllTsFiles(this.outdir);
      if (!rootFiles || rootFiles.length === 0) {
        logger.i('Build', '未发现任何 .ts 文件，跳过 TypeScript 编译');
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
          rootDir: this.outdir,
          strict: true,
          allowJs: true,
          sourceMap: false,
          incremental: true, // ✅ 启用增量编译
          tsBuildInfoFile: path.join(tempDir, 'tsbuildinfo') // ✅ 指定缓存文件
        },
        include: ["**/*.ts"]
      };

      const parsed = ts.parseJsonConfigFileContent(
        tsConfigJson,
        ts.sys,
        this.outdir,
        undefined,
        "tsconfig.json"
      );

      const program = ts.createProgram({
        rootNames: rootFiles,
        options: parsed.options
      });

      const emitResult = program.emit();
      const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
      allDiagnostics.forEach(d => {
        const msg = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        if (d.file) {
          const { line, character } = d.file.getLineAndCharacterOfPosition(d.start);
          logger.w('TypeScript', `${d.file.fileName} (${line + 1},${character + 1}): ${msg}`);
        } else {
          logger.w('TypeScript', msg);
        }
      });

      await this.removeJsFiles(path.join(this.outdir, 'scripts'));
      await this.copyCompiledOnly(tempDir, this.outdir);
      logger.i("Build", "TypeScript 编译完成");
    } catch (err) {
      logger.e('Build', '编译 TypeScript 时出错', err);
      throw err;
    } finally {
      await tempMod.remove();
    }
  }

  rmPackScriptCache() {
    return Promise.all([
      this.rmNpmDes(),
      fs.rm(path.join(this.outdir, 'scripts/package-lock.json'), {
        recursive: true,
        force: true
      }).catch(() => {})
    ]);
  }

  async handlerMod(modules, processed = new Set()) {
    const allModules = this.gamelibModule.getAll();
    const scriptOutDir = path.join(this.outdir, 'scripts/node_modules');
    let nextDeps = {};
    for (const [packageName, gitRepo] of Object.entries(modules)) {
      if (!allModules.includes(packageName) || processed.has(packageName)) continue;
      const srcDir = await this.gamelibModule.getDir(packageName, {
        gitUrl: gitRepo,
        v: this.d_data.mcVersion
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

  handleIncludes() {
    if (!Array.isArray(includes)) return;
    const copyOperations = includes
      .filter(item => typeof item === 'string')
      .map(async item => {
        const src = path.join(this.cwd, 'res', item);
        const dest = path.join(this.outdir, item);
        if (await utils.FileExsit(src)) {
          await utils.copy(src, dest);
          logger.i('Build', `已复制资源目录: ${item}`);
        }
      });
    return Promise.all(copyOperations);
  }

  async processMinification(data) {
    try {
      if (!Array.isArray(includes)) {
        logger.w('Build', 'includes.json 不是数组，跳过资源复制');
        return;
      }
      await minify(
        this.outdir,
        this.Modules,
        path.join(this.outdir, 'scripts'),
        this.baseDir,
        Boolean(data.minify)
      );
      await utils.waitGC();
    } catch (err) {
      logger.w('Build', '代码压缩失败', err);
    }
  }
}

module.exports = Build;