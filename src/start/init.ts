import * as fs from 'fs/promises';
import * as utils from '../utils/index.js';
import logger from './../loger/index.js';
import * as path from 'path';
import config from './../build/build-g-config.json';
import { spawn } from 'child_process';
import { Input } from "./../commander/index.js";
import { mcVersionGeter } from './../build/mcVersion.js';

let dirname: string = '';

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
      logger.w('init', '无效的配置');
      return;
    }
    if (await utils.isMblerProject(this.dir)) {
      logger.i('init', '已经初始化过了');
      return;
    }
    const name = await this.input('项目名称: ');
    const description = await this.input('项目描述: ');
    const mcVersion = await this.input('支持的minecraft版本: ');

    const packageer: Record<string, unknown> = {
      name,
      description,
      version: "0.0.1",
      engines: { node: ">=20.0.0" },
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

    if ((await this.input('使用Script Api吗？(Y/N) ')).toLowerCase() === 'y') {
      ManiFest.script = {} as Record<string, unknown>;
      (ManiFest.script as Record<string, unknown>).main = (await this.input('主脚本路径(如 ./index.js): ')) || "index";
      (ManiFest.script as Record<string, unknown>).ui = (await this.input('使用 UI 吗？(Y/N) ')).toLowerCase() === 'y';

      if ((ManiFest.script as Record<string, unknown>).ui) {
        (packageer.dependencies as Record<string, string>)["@minecraft/server-ui"] = mcVersionGeter.ToServerUi(mcVersion);
      }

      await Promise.all([
        fs.mkdir(path.join(this.dir, 'behavior', "scripts"), { recursive: true }),
        fs.mkdir(path.join(this.dir, 'resources'), { recursive: true }),
      ]);

      const e = await Input.select("选择语言", ["ts", "js", "mcx"]);
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

    await fs.writeFile(path.join(this.dir, 'package.json'), JSON.stringify(packageer, null, 2));
    await fs.writeFile(path.join(this.dir, config.PackageFile), JSON.stringify(ManiFest, null, 2));
  }

  async getVersion(param: string): Promise<string> {
    let v: string;
    let fall = false;
    while (true) {
      v = await utils.input(fall ? '格式错误，重新输入: ' + param : param);
      if (utils.isVerison(v)) break;
      fall = true;
    }
    return v;
  }

  async input(param: string, t: boolean = false): Promise<string> {
    return (await utils.input((t ? '不符合规范，重试: ' : '') + param)) || this.input(param, true);
  }
}

export = Init;