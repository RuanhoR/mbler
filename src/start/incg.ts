// 临时目录用于缓存
import Temp from './../runTemp'
// 用 git进行clone克隆仓库
import git from './../git'
// 字符表
import char from './../lang/index.js'
import loger from './../loger/index.js'
import * as utils from './../utils/index.js'
import fs from 'node:fs/promises'
import path from 'node:path'
import type {
  MblerConfigData
} from "../types.js"
import os from "node:os"
// 缓存数据用的
const cache = new Map();
// __dirname
let dirname: string = "";
// 第二个参数局域缓存，即git的url或本地目录
let gitRepo: string;
// 用于在验证失败时尝试降级本地仓库 
const VerifyId = 'gitUrl Verify Error'
const regex = /(https?:\/\/[^\s\/]+\/[^\s\/]+\/[^\s]+(?:\.git)?|(?:git@|[\w.-]+@)[\w.-]+:[^\s]+(?:\.git)?)/;
async function InstallGlobal(two: string, ab = true) {
  // 创建临时目录
  gitRepo = two
  const tempMod = new Temp(
    os.tmpdir()
  )
  try {
    await tempMod.init()
    if (two === "inner") return;
    // 在未指定 gitUrl 时抛错
    if (!two) throw new Error(char.noGitRepo)
    // 如果传入的链接不符合 git 的url要求，尝试作为本地目录添加
    if (!regex.test(two)) return await FileInstall()
    await git.clone(two, tempMod.dir)
    try {
      const pack = await utils.GetData(tempMod.dir)
      await addMod(pack, tempMod)
    } catch {
      throw new Error(char.installGit.NoPackage)
    }
    return true;
  } catch (err: any) {
    loger.e('INSTALL', err.message)
    return false;
  } finally {
    await tempMod.remove()
  }
}

async function FileInstall() {
  const dir = utils.join(dirname, gitRepo)
  const FileStat = await fs.stat(dir)
  if (FileStat.isFile()) throw new Error('No Folder')
  const pack = await utils.GetData(dir)
  await addMod(pack, {
    dir: dir
  })
}
async function isBigVerison(aD: string, bD: string) {
  const A = utils.ToArray((await utils.GetData(aD)).version);
  const B = utils.ToArray((await utils.GetData(aD)).version);
  for (let i = 0; i < 3; i++) {
    const a = A[i]
    const b = B[i]
    if (!a || !b) continue
    if (a !== b) return a > b ? 1 : -1;
  }
  return 0;
}
/*
 * 添加mbler模块
 * @param{string} 包名
 * @parsm{Temp} 临时目录，包下载后成果
 * @param{boolean} 是否在遇到同名依赖时询问或直接返回
 */
async function addMod(pack: MblerConfigData, tempMod: Temp | {
  dir: string
}, b: boolean = true) {
  loger.i('INSTALL', `${char.installGit.SetContent} ${pack.name}`)
  const soListDir = utils.join(
    dirname,
    './lib/modules/contents.json'
  )
  const soList = JSON.parse((await fs.readFile(soListDir)).toString())
  const installModPack = JSON.parse(await fs.readFile(path.join(tempMod.dir, "mbler.config.json"), "utf-8"))
  // 不允许覆盖内置包
  if (cache.get('innerDef').includes(pack.name)) return loger.e(
    'INSTALL', char.SameDes
  )
  const za = soList.find((item: any) =>
    item.name === pack.name || item.git === gitRepo
  );
  const isBig = await isBigVerison(tempMod.dir, path.join(dirname, "lib/modules", za.name))
  // 如果已经安装过了且版本号不大于已安装版本，询问是否覆盖
  if (za && !isBig && b) {
    if (await utils.input(char.installGit.HadBeen) !== 'Y') return;
  }
  soList.push({
    name: pack.name,
    git: gitRepo
  });
  // 写入索引表
  await fs.writeFile(soListDir, JSON.stringify(soList));
  // 复制
  await utils.copy(
    tempMod.dir,
    path.join(dirname, './lib/modules/', pack.name)
  )
}
export default async function InstallModules(Dirname: string, workDir: string) {
  try {
    dirname = Dirname;
    cache.set('innerDef',
      JSON.parse(await fs.readFile(path.join(dirname, './lib/modules/innerDef.json'), "utf-8"))
    )
    const p = await utils.GetData(workDir);
    const Mods = process.argv.slice(3)
    const dependencies = p.script?.dependencies || {};
    for (let i of Object.values(dependencies)) {
      if (!i) continue;
      await InstallGlobal(i, false)
    }
    for (let i of Mods) {
      if (!i) continue;
      await InstallGlobal(i, true)
    }
  } catch (err) {
    loger.e("INSTALL", `ERR in 'InstallModules' Func\nMessage: ${(err as Error).message}\nstack : ${(err as Error).stack}`)
  } finally {
    loger.i('INSTALL', char.installGit.InstallFinally)
  }
}