const utils = require('./../utils')
const char = require('./../lang')
const path = require('path')
const loger = require('./../loger')
const fs = require('fs/promises')
const config = require('./../build/build-g-config.json')
let modules = require('./../build/getModule')
let dirname

module.exports = async function AddPack(packName, dirname_, workDir) {
  dirname = dirname_
  modules = await modules(dirname)

  try {
    if (!modules.getAll().includes(packName)) {
      throw new Error(char.invalidDes)
    }
    // 检查 workDir 是否存在
    if (!await utils.FileExsit(workDir)) {
      throw new Error(char.config_invalid)
    }
    // 读取配置
    const packageObj = await utils.GetData(workDir)
    const gitUrl = modules.getGit(packName)
    if (!gitUrl) {
      throw new Error(`${packName} : ${char.noGitRepo}`)
    }
    // 修改 dependencies[packName]
    if (!packageObj?.script?.dependencies) {
      packageObj.script.dependencies = {} // 如果没有 dependencies，初始化它
    }
    packageObj.script.dependencies[packName] = gitUrl // 更新依赖
    const updatedContent = JSON.stringify(packageObj, null, 2)
    await fs.writeFile(
      path.join(workDir, config.PackageFile),
      updatedContent
    )
  } catch (err) {
    loger.e('add', `ERR- ${err.stack}`)
  }
}