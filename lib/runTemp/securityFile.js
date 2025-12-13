const fs = require('fs/promises')
const utils = require('./../utils')
class securityFile {
  #dir = null;
  constructor(dir) {
    this.#dir = dir;
  }
  #getDir(d) {
    const dir = utils.join(this.#dir, d)
    if (!dir.startsWith(this.#dir))
      throw new Error("[Mbler security] Don't into Parent Directory")
    return dir
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
module.exports = securityFile;