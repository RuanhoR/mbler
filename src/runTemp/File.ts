import * as utils from './../utils'
import fs from 'node:fs/promises'
import path from "node:path"
// 用于给 Temp 提供不需要导入 fs 的小支持
// 一些时候直接 Temp.dir 作为目录完事
export default class FileMethod {
  dir: string = "";
  #getDir(Dir: string) {
    return path.join(this.dir, Dir)
  }
  async mkdir(DirName: string) {
    try {
      await fs.mkdir(this.#getDir(DirName), {
        recursive: true
      });
      return true;
    } catch {
      return false
    }
  }
  async rm(File: string): Promise<boolean> {
    try {
      await fs.rm(this.#getDir(File), {
        recursive: true,
        force: true
      });
      return true
    } catch (err) {
      return false
    }
  }
  async writeFile(File: string, content: string | Buffer) {
    try {
      await fs.writeFile(this.#getDir(File), content);
      return true;
    } catch (err) {
      return false
    }
  }
  readFile(File: string) {
    return fs.readFile(this.#getDir(File))
  }
  async readdir(Dir: string) {
    return await fs.readdir(this.#getDir(Dir))
  }
}