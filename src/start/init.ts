import * as fs from `fs/promises`;
import * as utils from `./../utils/index.js`;
import logger from './../loger/index.js';
import * as path from 'path';
import config from './../build/build-g-config.json';
import * as lang from './../lang';
import { spawn } from 'child_process';
import commander from "./../commander/index.js";
import { mcVersionGeter } from './../build/mcVersion.js';

let dirname: string = '';

const booleanGet = (d: boolean): boolean => d === true ? true : false;

class Init {
  dir: string;
  dirName: string;

  constructor(dir: string, name: string) {
    dirname = name;
    this.dir = dir;
    this.dirName = name;
  }

  async start(): Promise<void> {
    if (!(await utils.FileExsit(this.dir))) {
      logger.w('init', lang.invalidConfig);
      return;
    }
    if (await utils.isMblerProject(this.dir)) {
      logger.i('init', lang.inited);
      return;
    }
    const name = await this.input(lang.init.name);
    const description = await this.input(lang.init.desc);
    const mcVersion = await this.input(lang.init.useMcVersion);
    const packageer: Record<string, unknown> = {
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
    };
    const ManiFest: Record<string, unknown> = {
      name,
      description,
      mcVersion,
      version: "0.0.1",
      minify: false
    };
    if ((await this.input(lang.init.useSapi))
      .toLowerCase() === 'y') {
      ManiFest.script = {} as Record<string, unknown>;
      (ManiFest.script as Record<string, unknown>).main = (await this.input(lang.init.main)) || "index";
      (ManiFest.script as Record<string, unknown>).ui = (await this.input(lang.init.useUi)).toLowerCase() === 'y';
      if ((ManiFest.script as Record<string, unknown>).ui) {
        (packageer.dependencies as Record<string, string>)["@minecraft/server-ui"] = mcVersionGeter.ToServerUi(mcVersion);
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
      (ManiFest.script as Record<string, unknown>).lang = e;
      if (e === "ts") {
        (packageer.dependencies as Record<string, string>)["@minecraft/server"] = mcVersionGeter.ToServer(mcVersion);
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
    );
    await fs.writeFile(
      path.join(this.dir, config.PackageFile),
      JSON.stringify(ManiFest, null, 2)
    );
  }

  async getVersion(param: string): Promise<string> {
    let v: string;
    let fall = false;
    while (true) {
      v = await utils.input(
        fall ?
        lang.init.InputFormatErr + param :
        param
      );
      if (utils.isVerison(v)) break;
      fall = true;
    }
    return v;
  }

  async input(param: string, t: boolean = false): Promise<string> {
    return (await utils.input(
      (t ? lang.init.ReInput : '') + param
    )) || this.input(param, true);
  }
}

export default Init;