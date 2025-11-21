const GetData = require('./GetData');
const path = require('path');
const isVersion = require('./isVersion');
const config = require('./../build/build-g-config.json')
/**
 * 检查版本号是否有效（有效返回 true）
 * @param {any} v
 * @returns {boolean}
 */
function isValidVersion(v) {
  return typeof v === 'string' && isVersion(v);
}

/**
 * 处理模块包配置，提取依赖、主入口、UI 配置等
 * @param {string} dir 模块目录路径
 * @param {Object} opt 可选参数（如：已处理的依赖列表）
 * @returns {Promise<Object>} { des: string[], ui: boolean, main: string }
 */
module.exports = async function handlerPackage(dir, opt = {}) {
  const result = {
    des: [], // 依赖模块名数组
    ui: false, // 是否使用 @minecraft/server-ui
    main: './index.js' // 默认主入口
  };
  let data;
  try {
    data = await GetData(dir);
  } catch (err) {
    throw new Error(`无法读取模块配置文件: ${path.join(dir, config.PackageFile)}`);
  }

  // 必需字段校验
  if (
    typeof data.name !== 'string' ||
    typeof data.description !== 'string' ||
    !isValidVersion(data.version)
  ) {
    throw new Error(
      `ERR-\n${path.join(dir, config.PackageFile)} 缺少必要字段。\n` +
      '必需字段: name, description, version'
    );
  }
  // opt.des : Type Array || undefined
  if (opt.des && data?.script?.dependencies)
    result.des = ForOfMod(data.script.dependencies, opt.des)
  result.ui = Boolean(Boolean(data?.script?.ui));
  if (isNonEmptyString(data?.script?.main)) {
    result.main = data.script.main;
  }
  result.name = data.name;
  result.version = data.version;
  result.description = data.description;
  return result;
};

// 工具函数：判断非空字符串
function isNonEmptyString(str) {
  return typeof str === 'string' && str.trim().length > 0;
}
 function ForOfMod(Mod, InstallMod) {
  // Mod : {name:git}
  let returnValue = {};
  console.log(Mod)
try{  for (const [packageName, gitRepo] of Object.entries(Mod)) {
    // InstallMod: Array<String: packageName>
    if (typeof InstallMod?.includes === 'function')
      if (InstallMod?.includes(packageName)) continue;
    returnValue[packageName] = gitRepo;
  }}catch{}
  return returnValue;
}