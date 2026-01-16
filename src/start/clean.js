const fs = require('fs/promises')
const utils = require('./../utils')
const loger = require('./../loger')
const path = require('path')
const lang = require('./../lang')
module.exports = class clean {
  constructor(p, baseDir) {
    this.p = p;
    this.dirname = baseDir;
    this.run = () => this.start().catch(err => {
      loger.e(err)
    })
  }
  async start() {
    if (!await utils.FileExsit(this.p)) {
      utils.Exit(`项目不存在`)
    }
    // 获取 mbler.config.json
    try {
      const packager = await utils.GetData(this.p)
      // 提取输出目录
      this.outdir = [
        /*resources*/
        this.getOutDir(packager.outdir?.resources),
        /*behavior*/
        this.getOutDir(packager.outdir?.behavior)
      ];
      await Promise.all(this.outdir.map((dir) => fs.rm(dir, {
        recursive: true,
        force: true
      }).catch(() => {})));
    } catch (err) {
      loger.e('clean', err)
    }
    loger.i('clean', lang.cleanFinally)
  }
  getOutDir(dir) {
    const outdir = dir;
    return outdir ? utils.join(this.p, outdir) : path.join(this.p, 'dist');
  }
}