import * as utils from './../utils/index.js';
import lang from './../lang/index.js';
import * as path from 'path';
import logger from './../loger/index.js';
import * as fs from 'fs/promises';
import config from './../build/build-g-config.json';
import getModule from './../build/getModule.js';

let modules: Awaited<ReturnType<typeof getModule>> | null = null;
let dirname: string = '';

export = async function AddPack(packName: string, dirname_: string, workDir: string): Promise<void> {
  dirname = dirname_;
  modules = await getModule(dirname);

  try {
    if (!modules.getAll().includes(packName)) {
      throw new Error(lang.invalidDes);
    }
    // 检查 workDir 是否存在
    if (!await utils.FileExsit(workDir)) {
      throw new Error(lang.config_invalid);
    }
    // 读取配置
    const packageObj = await utils.GetData(workDir);
    const gitUrl = modules.getGit(packName);
    if (!gitUrl) {
      throw new Error(`${packName} : ${lang.noGitRepo}`);
    }
    // 修改 dependencies[packName]
    if (!packageObj?.script?.dependencies) {
      packageObj.script!.dependencies = {}; // 如果没有 dependencies，初始化它
    }
    packageObj.script!.dependencies![packName] = gitUrl; // 更新依赖
    const updatedContent = JSON.stringify(packageObj, null, 2);
    await fs.writeFile(
      path.join(workDir, config.PackageFile),
      updatedContent
    );
  } catch (err) {
    logger.e('add', `ERR- ${(err as Error).stack}`);
  }
};