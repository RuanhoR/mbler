// 临时目录用于缓存
const Temp = require('./../runTemp')
// 用 git进行clone克隆仓库
const git = require('./../git')
// 字符表
const char = require('./../lang')
const loger = require('./../loger')
const utils = require('./../utils')
const fs = require('fs/promises')
const path = require('path')
// 缓存数据用的
const cache = new Map();
// __dirname
let dirname;
// 第二个参数局域缓存，即git的url或本地目录
let gitRepo;
// 用于在验证失败时尝试降级本地仓库
const VerifyId = 'gitUrl Verify Error'
const regex = /(https?:\/\/[^\s\/]+\/[^\s\/]+\/[^\s]+(?:\.git)?|(?:git@|[\w.-]+@)[\w.-]+:[^\s]+(?:\.git)?)/;
const os = require("os")
async function InstallGlobal(two, ab = true) {
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
  } catch (err) {
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
async function isBigVerison(aD, bD) {
  const A = utils.ToArray((await utils.GetData(aD)).version);
  const B = utils.ToArray((await utils.GetData(aD)).version);
  for (let i = 0; i < 3; i++) {
    if (A[i] !== B[i]) return A[i] > B[i] ? true : false;
  }
  return 0;
}
/*
 * 添加mbler模块
 * @param{string} 包名
 * @parsm{Temp} 临时目录，包下载后成果
 * @param{boolean} 是否在遇到同名依赖时询问或直接返回
 */
async function addMod(pack, tempMod, b = true) {
  loger.i('INSTALL', `${char.installGit.SetContent} ${pack.name}`)
  const soListDir = utils.join(
    dirname,
    './lib/modules/contents.json'
  )
  const soList = await utils.readFile(soListDir, {
    want: 'object'
  })
  const installModPack = await utils.readFile(path.join(tempMod.dir, "mbler.config.json"), {
    want: 'object'
  })
  // 不允许覆盖内置包
  if (cache.get('innerDef').includes(pack.name)) return loger.e(
    'INSTALL', char.SameDes
  )
  const za = soList.find(item =>
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
module.exports = async function InstallModules(Dirname, workDir) {
  try {
    dirname = Dirname;
    cache.set('innerDef',
      await utils.readFile(
        path.join(dirname, './lib/modules/innerDef.json'), {
          want: 'object'
        }
      )
    )
    const p = await utils.GetData(workDir);
    const Mods = process.argv.slice(3)
    for (let i of Object.values(p.script?.dependencies)) {
      if (!i) continue;
      await InstallGlobal(i, false)
    }
    for (let i of Mods) {
      if (!i) continue;
      await InstallGlobal(i, true)
    }
  } catch (err) {
    loger.e("INSTALL", `ERR in 'InstallModules' Func\nMessage: ${err.message}\nstack : ${err.stack}`)
  } finally {
    loger.i('INSTALL', char.installGit.InstallFinally)
  }
}