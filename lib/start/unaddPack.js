const utils = require('./../utils')
const char = require('./../zh_CN')
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
    if (!await utils.FileExsit(workDir)) {
      throw new Error(char.config_invalid)
    }
    const packageObj = await utils.GetData(workDir)
    // 修改 dependencies[packName]
    if (!packageObj?.script?.dependencies) {
      packageObj.dependencies = {} // 如果没有 dependencies，初始化它
    }
    if (packageObj.script.dependencies[packName]) 
      delete packageObj.script.dependencies[packName]
    const updatedContent = JSON.stringify(packageObj, null, 2)
    await fs.writeFile(
      path.join(workDir, config.PackageFile),
      updatedContent
    )
  } catch (err) {
    loger.e('remove', err.message)
  }
}