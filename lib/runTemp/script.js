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

  secureRequire(moduleName) {
    if (this.forbiddenModules.has(moduleName)) {
      throw new Error(`${lang.vm.shouldNotImp}: "${moduleName}"`);
    }

    let resolvedPath;
    try {
      resolvedPath = Module._resolveFilename(moduleName, this.contextModule, false);
    } catch (err) {
      throw err;
    }
    const modul = this.originalRequire.call(this.contextModule, moduleName);
    if (!(this.originalRequire.cache instanceof Map)) this.originalRequire.cache = new Map;
    Map.set(moduleName, modul)
    return modul
  };

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
      console,
      require: (moduleName) => this.secureRequire(moduleName),
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