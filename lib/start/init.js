const fs = require(`fs/promises`);
const utils = require(`./../utils`);
const logger = require('./../loger')
const path = require('path');
const config = require('./../build/build-g-config.json')
const {
  spawn
} = require('child_process');
const getMcv = require('./../build/mcVersion').mcVersionGeter
let dirname;
const booleanGet = (d) => d === true ? true : false
class init {
  constructor(dir, name) {
    dirname = name;
    this.dir = dir;
    this.start()
  }
  async start() {
    if (!(await utils.FileExsit(this.dir))) {
      logger.w('init', '无效的资源路径设置')
      return;
    }
    if (await utils.isMblerProject(this.dir)) {
      logger.i('init', '已经是GameLib项目，不需要初始化')
      return;
    }
    const name = await this.input('项目名称 ')
    const description = await this.input('项目描述 ')
    const mcVersion = await this.input('项目支持的mc版本 ')
    const packageer = {
      name,
      description,
      version: "0.0.1",
      engines: {
        node: ">=20.0.0"
      },
      scripts: {
        dev: "mbler dev",
        build: "mbler build"
      },
      dependencies: {
        "@minecraft/server": getMcv.ToServer(mcVersion)
      }
    }
    const ManiFest = {
      name,
      description,
      mcVersion,
      version: "0.0.1",
    }
    if ((await this.input('使用Script Api吗？(Y/N) '))
      .toLowerCase() === 'y') {
      ManiFest.script = await this.getScript()
      await fs.mkdir(path.join(this.dir, 'scripts'), {
        recursive: true
      });
      if ((await this.input('使用TypeScript吗？(Y/N) '))
        .toLowerCase() === 'y') {
        ManiFest.script.lang = "ts";
      }
    }
    await fs.writeFile(path.join(this.dir, 'package.json'), JSON.stringify(packageer, null,
      2))
    await fs.writeFile(
      path.join(this.dir, config.PackageFile),
      JSON.stringify(ManiFest, null, 2))
  }
  async getVersion(param) {
    let v;
    let fall = false;
    while (true) {
      v = await utils.input(
        fall ?
        '不是正确的x.x.x格式版本号，重新输入\n  ' + param :
        param
      )
      if (utils.isVersion(v)) break;
      fall = true;
    }
    return v
  }
  async getScript() {
    const returnValue = new Object();
    returnValue.main = await this.input('主脚本：')
    returnValue.ui = (await this.input('使用 UI 吗？(Y/N) '))
      .toLowerCase() === 'y'
    return returnValue
  }
  async input(param, t = false) {
    return (await utils.input(
      (t ? '不符合规范 重试：\n  ' : '') + param
    )) || this.input(param, true);
  }
}
module.exports = init