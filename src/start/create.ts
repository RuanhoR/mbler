import uuid from './../uuid/index.js';
import fs from 'fs/promises';
import * as utils from './../utils/index.js';
import path from 'path';
import git from './../git/index.js';
import { spawn } from 'child_process';
import Temp from './../runTemp/index.js';
import securityFile from './../runTemp/securityFile.js';

const regex = /(https?:\/\/[^\s\/]+\/[^\s\/]+\/[^\s]+(?:\.git)?|(?:git@|[\w.-]+@)[\w.-]+:[^\s]+(?:\.git)?)/;
const npmStart = "npm:";
let dirname: string = '';

export = async function workDirFunction(workDir: string, _dirname: string, param: string = ""): Promise<void> {
  param = param.trim();
  dirname = _dirname;
  // 如果已经初始化了
  try {
    if (!workDir) throw new Error("Wrok Dir is undefined");
    if (await utils.isMblerProject(workDir)) throw new Error("WorkDir is init You shouldn't use 'create' command");
    // 缓存id
    const CreateId = uuid.fromString(`ul-to-${param}`);
    const cacheDir = path.join(process.cwd(), "lib/initializer-cache", CreateId);
    // 如果缓存存在
    if (await utils.FileExsit(cacheDir)) {
      await Load(cacheDir, workDir);
      // 不存在缓存
    } else {
      const dir = utils.join(dirname, param);
      // 尝试匹配为git url
      if (regex.test(param)) {
        await git.clone(param, cacheDir);
      } else if (param.startsWith(npmStart)) {
        // 如果是 npm 包，需要加上 npm: 前缀
        const packageName = param.slice(npmStart.length);
        // 开始npm安装
        await NpmInstall(packageName, cacheDir);
      } else if (await utils.FileExsit(dir)) {
        // 情况 : 输入路径
        await copy(param, cacheDir);
      } else {
        throw new Error("Package source not match");
      }
      await Load(cacheDir, workDir);
    }
  } catch (err) {
    console.error(`加载模板初始化失败 错误信息\n${(err as Error).stack}`);
  }
};

async function Load(cacheDir: string, workDir: string): Promise<void> {
  const main = (JSON.parse(await fs.readFile(path.join(cacheDir, "package.json"), {
    encoding: "utf-8"
  })) as { main: string }).main;
  const MblerConfig = JSON.parse(await fs.readFile(path.join(cacheDir, "mbler.config.json"), {
    encoding: "utf-8"
  }));
  const query = {
    name: (MblerConfig as { name: string }).name,
    description: (MblerConfig as { description: string }).description,
    version: (MblerConfig as { version: string }).version,
    // securityFile提供不能来到上级的文件操作
    setWorkDir: new securityFile(workDir)
  };
  let run = require(path.join(cacheDir, main));
  run = run.main(query);
  if (run instanceof Promise) run = await run;
}

function runNpm(param: string[], cwd: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const processC = spawn('npm', param, {
      cwd,
      stdio: 'ignore'
    });
    processC.on('close', resolve);
    processC.on('error', (err) => {
      reject(err);
    });
  });
}

async function NpmInstall(dependencies: string, tagerDir: string): Promise<void> {
  const temp = new Temp(
    require("os").tmpdir()
  );
  await temp.init();
  const {
    dir
  } = temp;
  await fs.writeFile(path.join(dir, "package.json"), JSON.stringify({
    name: "",
    description: "",
    version: "0.0.1",
    type: "commjs"
  }));
  const rel = await runNpm(["install", dependencies], dir);
  if (rel !== 0) throw new Error(`npm package install falled`);
  const ModDor = path.join(dir, "node_modules");
  // 复制到目标目录
  await copy(ModDor, tagerDir);
  await temp.remove();
}

function copy(source: string, out: string): Promise<void> {
  return new Promise((then, error) => fs.readdir(source)
    .then((data) => Promise.all(data
      .map((file) => utils.copy(path.join(source, file), path.join(out, file)))
    ).then(() => then()))
    .catch(error)
  );
}