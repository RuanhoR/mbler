const fs = require(`fs/promises`);
const utils = require(`./../utils`);
const logger = require('./../loger')
const path = require('path');
const config = require('./../build/build-g-config.json')
const lang = require('./../lang')
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
      logger.w('init', lang.invalidConfi)
      return;
    }
    if (await utils.isMblerProject(this.dir)) {
      logger.i('init', lang.inited)
      return;
    }
    const name = await this.input(lang.init.name)
    const description = await this.input(lang.init.desc)
    const mcVersion = await this.input(lang.init.useMcVersion)
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
      }
    }
    const ManiFest = {
      name,
      description,
      mcVersion,
      version: "0.0.1",
      minify: false,
      outdir path.join(this.dir, "dist")
    }
    if ((await this.input(lang.init.useSapi))
      .toLowerCase() === 'y') {
      ManiFest.script = {}
      ManiFest.script.main = (await this.input(lang.init.main)) || "index"
      ManiFest.script.ui = (await this.input(lang.init.useUi)).toLowerCase() === 'y'
      if (ManiFest.script.ui) {
        packageer.dependencies["@minecraft/server-ui"] = getMcv.ToServerUi(mcVersion)
      }
      await fs.mkdir(path.join(this.dir, 'scripts'), {
        recursive: true
      });
      if ((await this.input(lang.init.useTs))
        .toLowerCase() === 'y') {
        ManiFest.script.lang = "ts";
        packageer.dependencies["@minecraft/server"] = getMcv.ToServer(mcVersion)
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
        lang.init.InputFormatErr + param :
        param
      )
      if (utils.isVersion(v)) break;
      fall = true;
    }
    return v
  }
  async getScript() {

  }
  async input(param, t = false) {
    return (await utils.input(
      (t ? lang.init.ReInput : '') + param
    )) || this.input(param, true);
  }
}
module.exports = init