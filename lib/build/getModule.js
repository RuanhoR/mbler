const fs = require('fs/promises');
const path = require('path');
const utils = require('./../utils');

// 目录缓存
const dirCache = new Map();
let cacheList = null;
const normalize = (v) => {
  return String(v || '').trim();
};
const parts = (v) => {
  return normalize(v)
    .split('.')
    .slice(0, 3)
    .map(n => parseInt(n, 10) || 0);
};

// 比较版本号，返回 1 表示 a > b，-1 表示 a < b，0 表示相等
const compareVer = (a, b) => {
  const A = parts(a);
  const B = parts(b);
  for (let i = 0; i < 3; i++) {
    if (A[i] !== B[i]) return A[i] > B[i] ? 1 : -1;
  }
  return 0;
};

// 判断版本范围是否合法：min < max
const isValidVersionRange = (min, max) => {
  return compareVer(max, min) === 1;
};

// 判断目标版本 v 是否在 [min, max] 范围内（闭区间）
const isVersionInRange = (v, min, max) => {
  return compareVer(v, min) >= 0 && compareVer(v, max) <= 0;
};

// ModulePath 类定义
class ModulePath {
  constructor(dirname) {
    this.dir = dirname;
    this.innerList = new Array();
    this.cache = {};
  }

  // 初始化：加载内容并读取 innerDef.json
  async start() {
    this.cache = await this.#loadContents();
    this.innerList = await utils.readFile(
      path.join(this.dir, 'lib/modules/innerDef.json'), {
        want: 'object'
      }
    );
  }

  // 根据模块名称获取对应的 git 地址
  getGit(Name) {
    for (const {
        name,
        git
      }
      of this.cache) {
      if (name === Name) return git;
    }
    return null;
  }

  // 获取所有模块名称列表
  getAll() {
    if (cacheList) return cacheList;
    cacheList = this.cache.map(item => item.name);
    return cacheList;
  }

  // 根据包名查找模块所在目录，同时校验版本
  async getDir(packageName, {
    gitUrl = '',
    v = "0.0.0"
  } = {}) {
    if (!packageName) return null;

    // 先查缓存
    if (dirCache.has(packageName)) {
      return dirCache.get(packageName);
    }

    for (const {
        name,
        git
      }
      of this.cache) {
      if (!/^[a-zA-Z0-9\-]*$/.test(name)) continue; // 只允许字母数字
      if (name !== packageName) continue;

      // 如果指定了 gitUrl，需校验是否匹配，除非是 inner 且存在于 innerList
      if (gitUrl) {
        if (git !== gitUrl) {
          if (!(git === 'inner' && this.innerList.includes(name))) {
            continue; // 不匹配且不是合法的 inner 模块则跳过
          }
        }
      }

      const ddirPath = path.join(this.dir, 'lib/modules', name);
      const packageJson = await utils.GetData(ddirPath);

      // 如果有 mcVersion 配置，则进行版本校验
      if (packageJson.mcVersion) {
        // 校验 mcVersion 格式是否正确
        if (!Array.isArray(packageJson.mcVersion) || packageJson.mcVersion.length !== 2) {
          utils.Exit(`ERR - ${name} 模块的 mcVersion 配置格式错误，应为 [minVersion, maxVersion]，如 ["1.0.0", "2.0.0"]`);
        }
        const [min, max] = packageJson.mcVersion;
        // 校验版本范围是否合法：max 必须 > min
        if (!isValidVersionRange(min, max)) {
          utils.Exit(`ERR - ${name} 模块 mcVersion 配置不正确：最高版本必须大于最低版本\n当前配置：min=${min}, max=${max}\n请联系开发者获取稳定版本`);
        }

        // 校验传入的版本号 v 是否在 [min, max] 范围内
        if (!isVersionInRange(v, min, max)) {
          return {
            ERR: "V",
            message: `模块 "${name}" 不支持当前版本 v=${v}，要求版本范围：[${min}, ${max}]`
          };
        }
      }

      // 所有校验通过，缓存并返回模块路径
      dirCache.set(packageName, ddirPath);
      return ddirPath;
    }

    // 没找到对应模块
    return null;
  }

  // 读取 contents.json 文件内容
  async #loadContents() {
    const dataPath = path.join(this.dir, 'lib/modules/contents.json');
    try {
      if (await this.#fileExists(dataPath)) {
        const content = await fs.readFile(dataPath, 'utf8');
        const data = utils.JSONparse(content);
        return typeof data === 'object' && data !== null ? data : {};
      }
    } catch (err) {
      console.error('Failed to load contents.json:', err);
    }
    return {};
  }
  // 检查文件是否存在
  async #fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
module.exports = async (dirname) => {
  const instance = new ModulePath(dirname);
  await instance.start();
  return instance;
};