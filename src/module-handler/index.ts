import GitRepo from "../git";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import fs$1 from "node:fs/promises";
import * as utils from "./../utils";
import { Input } from "../commander";
import lang from "../lang/index.js";
import loger from "../loger/index.js";

const gitVerifyReg = /(https?:\/\/[^\s\/]+\/[^\s\/]+\/[^\s]+(?:\.git)?|(?:git@|[\w.-]+@)[\w.-]+:[^\s]+(?:\.git)?)/;

// 缓存
const cache = new Map<string, unknown>();
let moduleDirname: string = "";
let gitRepo: string = "";
let cacheList: string[] | null = null;

/**
 * 版本号转数组
 */
function versionToArray(v: string | null | undefined): number[] {
  return String(v || '0.0.0').trim()
    .split('.')
    .slice(0, 3)
    .map((n: string): number => parseInt(n, 10) || 0);
}

/**
 * 比较版本号
 */
function compareVersion(a: string, b: string): number {
  const A = versionToArray(a);
  const B = versionToArray(b);
  for (let i = 0; i < 3; i++) {
    const a = A[i];
    const b = B[i];
    if (a === undefined || b === undefined) continue;
    if (a !== b) return a > b ? 1 : -1;
  }
  return 0;
}

class ModuleDir {
  public static curreny: string;

  static get(): string {
    if (ModuleDir.curreny) return ModuleDir.curreny;
    const d = path.join(os.homedir(), ".cache/mbler/.moduleDir.db");
    let content: string;
    try {
      content = fs.readFileSync(d, "utf-8").toString();
    } catch {
      content = path.join(__dirname, "../modules");
    }
    ModuleDir.curreny = content;
    return content;
  }

  static async set(newDir: string): Promise<boolean> {
    if (!ModuleDir.curreny) ModuleDir.get();
    if (!await utils.FileExsit(newDir)) throw new TypeError("[module dir set]: dir isn't exsit");
    await fs$1.cp(ModuleDir.curreny, newDir, {
      recursive: true,
      force: true
    });
    const userSelect = await Input.select("已将模块复制至目标文件夹，是否删除旧文件夹？ ", ["Y", "N"]);
    if (userSelect == "Y") {
      await fs$1.rm(ModuleDir.curreny, {
        recursive: true
      });
    } else if (userSelect !== "N") {
      throw new Error("[moduleDir set]: ??? your select is sb");
    }
    ModuleDir.curreny = newDir;
    return true;
  }
}

/**
 * 获取模块列表
 */
export async function getModules(dirname: string): Promise<string[]> {
  const contentsPath = path.join(dirname, './lib/modules/contents.json');
  const data = JSON.parse((await fs$1.readFile(contentsPath, "utf-8")).toString());
  return data.map((item: any) => item.name);
}

/**
 * 根据名称获取模块 Git URL
 */
export async function getModuleGit(dirname: string, packName: string): Promise<string | null> {
  const contentsPath = path.join(dirname, './lib/modules/contents.json');
  const data = JSON.parse((await fs$1.readFile(contentsPath, "utf-8")).toString());
  const moduleItem = data.find((item: any) => item.name === packName);
  return moduleItem?.git || null;
}

/**
 * 添加包到依赖
 */
export async function addPack(packName: string, dirname_: string, workDir: string): Promise<void> {
  const dirname = dirname_;
  const modules = await getModuleInfo(dirname);

  try {
    if (!modules.getAll().includes(packName)) {
      throw new Error(lang.invalidDes);
    }
    if (!await utils.FileExsit(workDir)) {
      throw new Error(lang.config_invalid);
    }
    const packageObj = await utils.GetData(workDir);
    const gitUrl = await getModuleGit(dirname, packName);
    if (!gitUrl) {
      throw new Error(`${packName} : ${lang.noGitRepo}`);
    }
    if (!packageObj?.script?.dependencies) {
      packageObj.script!.dependencies = {};
    }
    packageObj.script!.dependencies![packName] = gitUrl;
    const updatedContent = JSON.stringify(packageObj, null, 2);
    await fs$1.writeFile(
      path.join(workDir, path.basename(utils.config.PackageFile)),
      updatedContent
    );
  } catch (err) {
    loger.e('add', `ERR- ${(err as Error).stack}`);
  }
}

/**
 * 从包依赖中移除
 */
export async function unaddPack(packName: string, dirname_: string, workDir: string): Promise<void> {
  const dirname = dirname_;
  const modules = await getModuleInfo(dirname);

  try {
    if (!modules.getAll().includes(packName)) {
      throw new Error(lang.invalidDes);
    }
    if (!await utils.FileExsit(workDir)) {
      throw new Error(lang.config_invalid);
    }
    const packageObj = await utils.GetData(workDir);
    if (packageObj?.script?.dependencies?.[packName]) {
      delete packageObj.script!.dependencies![packName];
      const updatedContent = JSON.stringify(packageObj, null, 2);
      await fs$1.writeFile(
        path.join(workDir, path.basename(utils.config.PackageFile)),
        updatedContent
      );
    }
  } catch (err) {
    loger.e('unadd', `ERR- ${(err as Error).stack}`);
  }
}

/**
 * 安装全局模块
 */
async function installGlobal(two: string, ab = true): Promise<boolean> {
  gitRepo = two;
  const tempDir = path.join(os.tmpdir(), `mbler-${Date.now()}`);

  try {
    if (two === "inner") return true;
    if (!two) throw new Error(lang.noGitRepo);
    if (!gitVerifyReg.test(two)) return await fileInstall(two);

    await GitRepo.clone(two, tempDir);
    try {
      const pack = await utils.GetData(tempDir);
      await addMod(pack, { dir: tempDir });
    } catch {
      throw new Error(lang.installGit.NoPackage);
    }
    return true;
  } catch (err: any) {
    loger.e('INSTALL', err.message);
    return false;
  } finally {
    await fs$1.rm(tempDir, { recursive: true, force: true });
  }
}

/**
 * 从本地文件安装模块
 */
async function fileInstall(localPath: string): Promise<boolean> {
  const dir = path.join(moduleDirname, localPath);
  const fileStat = await fs$1.stat(dir);
  if (fileStat.isFile()) throw new Error('No Folder');
  const pack = await utils.GetData(dir);
  await addMod(pack, { dir: dir });
  return true;
}

/**
 * 比较模块版本
 */
async function compareModuleVersion(aD: string, bD: string): Promise<number> {
  const A = versionToArray((await utils.GetData(aD)).version);
  const B = versionToArray((await utils.GetData(bD)).version);
  for (let i = 0; i < 3; i++) {
    const a = A[i];
    const b = B[i];
    if (a === undefined || b === undefined) continue;
    if (a !== b) return a > b ? 1 : -1;
  }
  return 0;
}

/**
 * 添加模块到系统
 */
async function addMod(pack: any, tempMod: { dir: string }, b: boolean = true): Promise<void> {
  loger.i('INSTALL', `${lang.installGit.SetContent} ${pack.name}`);
  const soListDir = path.join(moduleDirname, './lib/modules/contents.json');
  const soList = JSON.parse((await fs$1.readFile(soListDir)).toString());
  const installModPack = JSON.parse(await fs$1.readFile(path.join(tempMod.dir, "mbler.config.json"), "utf-8"));

  const innerDef = cache.get('innerDef') as string[];
  if (innerDef?.includes(pack.name)) {
    return loger.e('INSTALL', lang.SameDes);
  }

  const za = soList.find((item: any) => item.name === pack.name || item.git === gitRepo);
  const versionCompare = za ? await compareModuleVersion(tempMod.dir, path.join(moduleDirname, "lib/modules", za.name)) : 1;

  if (za && versionCompare <= 0 && b) {
    if (await utils.input(lang.installGit.HadBeen) !== 'Y') return;
  }

  soList.push({ name: pack.name, git: gitRepo });
  await fs$1.writeFile(soListDir, JSON.stringify(soList));
  await utils.copy(tempMod.dir, path.join(moduleDirname, './lib/modules/', pack.name));
}

/**
 * 安装模块
 */
export async function installModules(Dirname: string, workDir: string): Promise<void> {
  try {
    moduleDirname = Dirname;
    cache.set('innerDef',
      JSON.parse(await fs$1.readFile(path.join(moduleDirname, './lib/modules/innerDef.json'), "utf-8"))
    );
    const p = await utils.GetData(workDir);
    const Mods = process.argv.slice(3);
    const dependencies = p.script?.dependencies || {};
    for (const i of Object.values(dependencies)) {
      if (!i) continue;
      await installGlobal(i as string, false);
    }
    for (const i of Mods) {
      if (!i) continue;
      await installGlobal(i, true);
    }
  } catch (err) {
    loger.e("INSTALL", `ERR in 'InstallModules' Func\nMessage: ${(err as Error).message}\nstack : ${(err as Error).stack}`);
  } finally {
    loger.i('INSTALL', lang.installGit.InstallFinally);
  }
}

/**
 * 卸载单个模块
 */
export async function uninstallModule(packName: string, dirname: string): Promise<boolean> {
  try {
    moduleDirname = dirname;
    cache.set('innerDef',
      JSON.parse(await fs$1.readFile(path.join(moduleDirname, './lib/modules/innerDef.json'), "utf-8"))
    );
    return await uninstallGlobalInternal(packName);
  } catch (err) {
    loger.e('uninstall', (err as Error).message);
    return false;
  }
}

/**
 * 卸载模块
 */
export async function unInstallModules(Dirname: string, workDir: string): Promise<void> {
  try {
    moduleDirname = Dirname;
    cache.set('innerDef',
      JSON.parse(await fs$1.readFile(path.join(moduleDirname, './lib/modules/innerDef.json'), "utf-8"))
    );
    const p = await utils.GetData(workDir);
    const Mods = process.argv.slice(3);
    const dependencies = p.script?.dependencies || {};
    for (const i of Object.keys(dependencies)) {
      if (!i) continue;
      await uninstallGlobalInternal(i);
    }
    for (const i of Mods) {
      if (!i) continue;
      await uninstallGlobalInternal(i);
    }
  } catch (err) {
    loger.e("UNINSTALL", `ERR in 'unInstallModules' Func\nMessage: ${(err as Error).message}\nstack : ${(err as Error).stack}`);
  } finally {
    loger.i('UNINSTALL', lang.uninstallFinally);
  }
}

async function uninstallGlobalInternal(moduleName: string): Promise<boolean> {
  try {
    const contentsPath = path.join(moduleDirname, './lib/modules/contents.json');
    const contents = JSON.parse((await fs$1.readFile(contentsPath, "utf-8")).toString());

    const moduleIndex = contents.findIndex((item: any) => item.name === moduleName);
    if (moduleIndex === -1) {
      loger.e('UNINSTALL', `${lang.moduleNotFound}: ${moduleName}`);
      return false;
    }

    const moduleItem = contents[moduleIndex];
    const innerDef = cache.get('innerDef') as string[];
    if (innerDef?.includes(moduleName)) {
      loger.e('UNINSTALL', lang.CannotDeleteInner);
      return false;
    }

    contents.splice(moduleIndex, 1);
    await fs$1.writeFile(contentsPath, JSON.stringify(contents, null, 2));

    const modulePath = path.join(moduleDirname, './lib/modules/', moduleName);
    await fs$1.rm(modulePath, { recursive: true, force: true });

    loger.i('UNINSTALL', `${lang.uninstallSuccess}: ${moduleItem.name}`);
    return true;
  } catch (err: any) {
    loger.e('UNINSTALL', err.message);
    return false;
  }

  async function uninstallGlobal(moduleName: string): Promise<boolean> {
    try {
      const contentsPath = path.join(moduleDirname, './lib/modules/contents.json');
      const contents = JSON.parse((await fs$1.readFile(contentsPath, "utf-8")).toString());

      const moduleIndex = contents.findIndex((item: any) => item.name === moduleName);
      if (moduleIndex === -1) {
        loger.e('UNINSTALL', `${lang.moduleNotFound}: ${moduleName}`);
        return false;
      }

      const moduleItem = contents[moduleIndex];
      const innerDef = cache.get('innerDef') as string[];
      if (innerDef?.includes(moduleName)) {
        loger.e('UNINSTALL', lang.CannotDeleteInner);
        return false;
      }

      contents.splice(moduleIndex, 1);
      await fs$1.writeFile(contentsPath, JSON.stringify(contents, null, 2));

      const modulePath = path.join(moduleDirname, './lib/modules/', moduleName);
      await fs$1.rm(modulePath, { recursive: true, force: true });

      loger.i('UNINSTALL', `${lang.uninstallSuccess}: ${moduleItem.name}`);
      return true;
    } catch (err: any) {
      loger.e('UNINSTALL', err.message);
      return false;
    }
  }
}

/**
 * 获取资源配置
 */
export async function getResConfig(dirname: string): Promise<Map<string, any>> {
  cache.set('Mod', JSON.parse(await fs$1.readFile(path.join(dirname, './lib/modules/contents.json'), "utf-8")));
  cache.set('innerDef', JSON.parse(await fs$1.readFile(path.join(dirname, './lib/modules/innerDef.json'), "utf-8")));
  return cache;
}

/**
 * ModulePath 类 - 用于获取模块信息
 */
interface ModuleCacheItem {
  name: string;
  git: string;
}

class ModulePath {
  dir: string;
  cache: ModuleCacheItem[];

  constructor(dirname: string) {
    this.dir = dirname;
    this.cache = [];
  }

  async start(): Promise<void> {
    this.cache = await this.#loadContents();
  }

  getGit(name: string): string | null {
    for (const item of this.cache) {
      if (item.name === name) return item.git;
    }
    return null;
  }

  getAll(): string[] {
    if (cacheList) return cacheList;
    cacheList = this.cache.map(item => item.name);
    return cacheList;
  }

  async #loadContents(): Promise<ModuleCacheItem[]> {
    const dataPath = path.join(this.dir, 'lib/modules/contents.json');
    try {
      const content = await fs$1.readFile(dataPath, 'utf8');
      const data = utils.JSONparse(content);
      return (typeof data === 'object' && data !== null) ? data as ModuleCacheItem[] : [];
    } catch (err) {
      console.error('Failed to load contents.json:', err);
      return [];
    }
  }
}

/**
 * 获取模块信息
 */
export async function getModuleInfo(dirname: string): Promise<ModulePath> {
  cacheList = null;
  const instance = new ModulePath(dirname);
  await instance.start();
  return instance;
}

export default class Module {
  public static globalModuleDir: string = ModuleDir.get();

  public static async Install(mod: Mod): Promise<InstallReturn> {
    let result: InstallReturn = {
      lastTip: "",
      res: false
    };
    let from: string = mod.git;
    if (mod.git == "inner") {
      from = "git+https://github.com/Ruanhor.git";
    }
    if (from.startsWith("git+")) {
      const moduleDir = path.join(ModuleDir.curreny, mod.name);
      if (await utils.FileExsit(moduleDir)) {
        result.lastTip = "error: [module]: " + mod.name + "exsit";
      }
      const gitUrl = from.replace("git+", "");
      if (!gitVerifyReg.test(gitUrl)) {
        result.lastTip = "error: [clone git]: url isn't format";
        return result;
      }
      await GitRepo.clone(gitUrl, moduleDir);
    }
    if (from.startsWith(""))
      return result;
    return result;
  }
}

export interface Mod {
  name: string;
  git: string;
}

export interface InstallReturn {
  lastTip?: string;
  res: boolean;
}