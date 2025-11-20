// 临时目录用于缓存
const Temp = require('./../runTemp')
// 用 git进行clone克隆仓库
const git = require('./../git')
// 字符表
const char = require('./../zh_CN')
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

async function InstallGlobal(two, Dirname) {
  dirname = Dirname;
  cache.set('innerDef',
    await utils.readFile(
      path.join(dirname, './lib/modules/innerDef.json'), {
        want: 'object'
      }
    )
  )
  // 创建临时目录
  gitRepo = two
  const tempMod = new Temp(
    './lib/data/cache',
    dirname
  )
  await tempMod.init()
  try {
    // 在未指定 gitUrl 时抛错
    if (!two) throw new Error(char.noGitRepo)
    // 如果传入的链接不符合 git 的url要求，尝试作为本地目录添加
    if (!regex.test(two)) return await FileInstall()
    await git.clone(two, tempMod.dir)
    try {
      const pack = await utils.handlerPackage(tempMod.dir)
      await addMod(pack, tempMod)
    } catch {
      throw new Error(char.installGit.NoPackage)
    }
  } catch (err) {
    loger.e('INSTALL', err.message)
  } finally {
    loger.i('INSTALL', char.installGit.InstallFinally)
    await tempMod.remove()
  }
}

async function FileInstall() {
  const dir = utils.join(dirname, gitRepo)
  const FileStat = await fs.stat(dir).catch(err => {
    // 重写错误
    throw new Error('目录不存在')
  })
  if (FileStat.isFile()) throw new Error('目录非文件夹')
  const pack = await utils.handlerPackage(dir)
  await addMod(pack, {
    dir: dir
  })
}

async function addMod(pack, tempMod) {
  loger.i('INSTALL', `${char.installGit.SetContent} ${pack.name}`)
  const soListDir = utils.join(
    dirname,
    './lib/modules/contents.json'
  )
  const soList = await utils.readFile(soListDir, {
    want: 'object'
  })
  // 不允许覆盖内置包
  if (cache.get('innerDef').includes(pack.name)) return loger.e(
    'INSTALL', '与内置包同名，安装失败'
  )
  // 如果已经安装过了，询问是否覆盖
  if (soList.some(item =>
      item.name === pack.name || item.git === gitRepo
    )) {
    if (await utils.input(
        char.installGit.HadBeen
      ) !== 'Y') return;
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
module.exports = InstallGlobal;