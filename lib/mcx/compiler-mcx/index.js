/**
 * @typedef {Object} MCLoadOpt
 * @property {string} project - 项目行为包根目录
 * @property {string[]} desList - mbler依赖系统中构建包所包含的依赖列表
 * @property {string} main - 主入口文件的地址
 * @property {string} outdir - 输出目录地址
 */

const path = require("node:path")
const Compile = require("./Compile")
/**
 * 构建mcx工厂函数
 * @param {MCLoadOpt} opt 
 * @returns {Load} - 构建好的LOad类
 */
module.exports = (opt) => new Load(opt);
class Load {
  opt;
  /**
   * mcx加载构建函数
   * @param {MCLoadOpt} opt 
   */
  constructor(opt) {
    this.opt = opt;
  }
  async start() {
    // 获取包配置
    const config = utlis.GetData(this.buildDir);
    if (confg.script?.lang !== "mcx") throw new Error("This is not a mcx project");
    const main = config.script?.main;
    let BabelParserOpt = {};
    if (typeof config.script?.BabelParserOpt === "object") BabelParserOpt = config.script.BabelParserOpt;
    if (typeof main == "string" && main.endsWith(".js")) {
      // main指定的一定要是js文件，否则报错(参考计划文档)
      this.opt.main = path.join(this.opt.BuildDir, main);
      const Compiler = new Compile(this.opt, BabelParserOpt);
      await Compiler.start();
    } else {
      throw new TypeError("config script.main should not be not 'string'")
    }
  }
}