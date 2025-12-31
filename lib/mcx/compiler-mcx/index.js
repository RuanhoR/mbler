const path = require("node:path")
const Compile = require("./Compile")
module.exports = (dir, outdir, desList) => new Load(dir, outdir, desList)
class Load {
  opt;
  constructor(opt) {
    this.opt = opt;
  }
  async start() {
    // 获取包配置
    const config = utlis.GetData(this.buildDir);
    if (confg.script?.lang !== "mcx") throw new Error("This is not a mcx project");
    const main = config.script?.main;
    if (typeof main == "string" && main.endsWith(".js")) {
      // main指定的一定要是js文件，否则报错(参考计划文档)
      
      const Compiler = new Compile();
      await Compiler.start();
    } else {
      throw new TypeError("config script.main should not be not 'string'")
    }
  }
}