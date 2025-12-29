const fs = require(`fs/promises`);
const utils = require(`./../utils`);
const logger = require('./../loger')
const path = require('path');
const config = require('./../build/build-g-config.json')
const lang = require('./../lang')
const {
  spawn
} = require('child_process');
const commander = require("./../commander")
const getMcv = require('./../build/mcVersion').mcVersionGeter
let dirname;
const booleanGet = (d) => d === true ? true : false
class init {
  constructor(dir, name) {
    dirname = name;
    this.dir = dir;
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
        build: "MBLER_BUILD_MODULE=dist mbler build",
        "dev-build": "MBLER_BUILD_MODULE=dev mbler build"
      },
      dependencies: Object.create(null)
    }
    const ManiFest = {
      name,
      description,
      mcVersion,
      version: "0.0.1",
      minify: false
    }
    if ((await this.input(lang.init.useSapi))
      .toLowerCase() === 'y') {
      ManiFest.script = {}
      ManiFest.script.main = (await this.input(lang.init.main)) || "index"
      ManiFest.script.ui = (await this.input(lang.init.useUi)).toLowerCase() === 'y'
      if (ManiFest.script.ui) {
        packageer.dependencies["@minecraft/server-ui"] = getMcv.ToServerUi(mcVersion)
      }
      await Promise.all([
        fs.mkdir(path.join(this.dir, 'behavior', "script"), {
          recursive: true
        }),
        fs.mkdir(path.join(this.dir, 'resources'), {
          recursive: true
        }),
      ]);
      const e = await commander.select("选择语言", ["ts", "js", "mcx"]);
      ManiFest.script.lang = e;
      if (e === "ts") {
        packageer.dependencies["@minecraft/server"] = getMcv.ToServer(mcVersion)
      }
    }
    ManiFest.outdir = {
      resources: "./dist/res",
      behavior: "./dist/dep",
      dist: "./dist.mcaddon"
    };
    await fs.writeFile(
      path.join(this.dir, 'package.json'),
      JSON.stringify(packageer, null, 2)
    )
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
  async input(param, t = false) {
    return (await utils.input(
      (t ? lang.init.ReInput : '') + param
    )) || this.input(param, true);
  }
}
module.exports = init