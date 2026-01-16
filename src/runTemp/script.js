const vm = require('vm');
const path = require('path');
const fs = require('fs');
const Module = require('module');
const utils = require("./../utils")
const lang = require('./../lang')
class SafeRunner {
  constructor(runFilePath, forbiddenModules = []) {
    this.runFilePath = path.resolve(runFilePath);
    this.forbiddenModules = new Set(forbiddenModules);
    this.originalRequire = Module.prototype.require;
  }
  cache = new Map();
  secureRequire(moduleName, filePath) {
    if (this.cache.has(moduleName)) return this.cache.get(moduleName)
    try {
      if (this.forbiddenModules.has(moduleName)) {
        throw new Error(`${lang.vm.shouldNotImp}: "${moduleName}"`);
      }
      let resolvedPath = "";
      let modul;
      if (["path"].includes(moduleName)) {
        modul = this.originalRequire.call(this.contextModule, moduleName);
      } else {
        resolvedPath = this.Join(moduleName, filePath);
        modul = this.run(resolvedPath);
      }
      if (!(this.cache instanceof Map)) this.cache = new Map;
      this.cache.set(moduleName, modul)
      return modul
    } catch (err) {
      console.log(err)
      return {}
    }
  };
  // 由于require是同步的，使用Sync版本fs
  accessSync(filePath) {
    try {
      fs.accessSync(filePath);
      return true
    } catch {
      return false;
    }
  }
  // 合并 require 输入目录
  Join(moduleName, filePath) {
    // 判断模块名为路径
    const PathParse = path.parse(moduleName);
    // 根目录指定返回自身
    if (PathParse.root === "/") return moduleName;
    // 是否是相对目录
    if (PathParse.dir.startsWith("./")) return path.join(filePath, moduleName);
    // 都不是，向上查找 node_modules
    const d = this.find_node_modules(filePath, moduleName);
    // 阅读 package.json
    const packager = JSON.parse(fs.readFileSync(path.join(
      d, "node_modules",
      moduleName, "package.json"
    )));
    return path.join(d, "node_modules", moduleName, packager.main)
  }
  find_node_modules(filePath, moduleName) {
    let dir = filePath;
    for (let i = 0; i < filePath.split("/").length - 1; i++) {
      // 模块 存在
      if (this.accessSync(path.join(dir, "node_modules", moduleName))) {
        return dir;
      }
      dir = path.dirname(dir);
    }
    throw new Error("Not Found Module " + moduleName);
  }
  /**
   * 运行目标脚本，并返回该模块的 module.exports
   * @param {string} filePath - 脚本路径（相对于 runFilePath）
   * @returns {*} 模块的导出内容，即 module.exports
   */
  run(filePath) {
    const absoluteScriptPath = path.resolve(this.runFilePath, filePath);
    let code;
    try {
      code = fs.readFileSync(absoluteScriptPath, 'utf8');
    } catch (err) {
      throw new Error(`无法读取脚本文件 "${filePath}"，路径: ${absoluteScriptPath}，错误: ${err.message}`);
    }
    const context = vm.createContext({
      require: (moduleName) => this.secureRequire(moduleName, filePath),
      __filename: absoluteScriptPath,
      __dirname: path.dirname(absoluteScriptPath),
      process: Object.freeze(Object.setPrototypeOf({}, new Process)),
      Buffer,
      global,
      Array,
      Object,
      Map,
      WeakMap,
      Number,
      parseInt,
      clearTimeout,
      setTimeout,
      clearInterval,
      setInterval,
      fetch,
      String,
      MblerApi: {
        input: utils.input,
        isMblerProject: utils.isMblerProject
      },
    });
    const contextModule = new Module(absoluteScriptPath, module.parent);
    contextModule.filename = absoluteScriptPath;
    contextModule.paths = Module._nodeModulePaths(path.dirname(absoluteScriptPath));
    context.module = contextModule;
    context.Module = Module;
    context.exports = contextModule.exports
    const script = new vm.Script(code, {
      filename: absoluteScriptPath,
      displayErrors: true,
    });
    try {
      script.runInContext(context);
    } catch (err) {
      throw new Error(`${lang.vm.runScriptErr} "${filePath}" : ${err.stack}`);
    }
    return contextModule.exports;
  }
}
class Process {
  argv = process.argv
  env = process.env
  versions = process.versions
  version = process.version
  exit() {
    throw new Error("exit")
  }
  nextTick(func) {
    process.nextTick(func)
  }
  config = process.config
}
module.exports = SafeRunner;