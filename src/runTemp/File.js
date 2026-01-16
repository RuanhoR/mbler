const utils = require('./../utils')
const fs = require('fs/promises')
// 用于给 Temp 提供不需要导入 fs 的小支持
// 一些时候直接 Temp.dir 作为目录完事
module.exports = class FileMethod {
  dir = null;
  #getDir(Dir) {
    return path.join(this.dir, DirName)
  }
  async mkdir(DirName) {
    try {
      await fs.mkdir(this.#getDir(DirName), {
        recursive: true
      });
      return true;
    } catch {
      return false
    }
  }
  async rm(File) {
    try {
      await fs.rm(this.#getDir(DirName), {
        recursive: true,
        force: true
      });
      return true
    } catch (err) {
      return false
    }
  }
  async writeFile(File, content) {
    try {
      await fs.writeFile(this.#getDir(File), content, {
        recursive: true,
        force: true
      });
      return true;
    } catch (err) {
      return false
    }
  }
  async readFile(File, opt) {
    return await utils.readFile(this.#getDir(File), opt)
  }
  async readdir(Dir) {
    return await fs.readdir(this.#getDir(Dir))
  }
}