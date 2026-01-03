const path = require("node:path")
const Compile = require("./Compile")
/**
 * 构建mcx工厂函数
 * @param {MCxCompileOpt} opt 
 * @returns {Promise<boolean} - 异步构建
 * @throw {TypeError}
 */
module.exports = (opt) => (new Compile(opt)).start();
