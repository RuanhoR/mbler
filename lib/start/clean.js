const fs = require('fs/promises')
const utils = require('./../utils')
const loger = require('./../loger')
const path = require('path')
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
    // 获取 package.json
    try {
      const packager = await utils.GetData(this.p)
      // 提取输出目录
      this.outdir = packager.outdir || path.join(this.p, 'dist')
      await fs.rm(this.outdir, {
        recursive: true,
        force: true
      })
    } catch (err) {
      loger.e('clean', err)
     }
    loger.i('clean', '已删除构建版本')
  }
}