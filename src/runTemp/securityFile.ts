import fs from 'fs/promises';
import * as utils from '../utils/index.js';

export default class SecurityFile {
  #dir: string | null = null;

  constructor(dir: string) {
    this.#dir = dir;
  }

  #getDir(d: string): string {
    const dir = utils.join(this.#dir!, d);
    if (!dir.startsWith(this.#dir!))
      throw new Error("[Mbler security] Don't into Parent Directory");
    return dir;
  }

  async mkdir(DirName: string): Promise<boolean> {
    try {
      await fs.mkdir(this.#getDir(DirName), {
        recursive: true
      });
      return true;
    } catch {
      return false;
    }
  }

  async rm(File: string): Promise<boolean> {
    try {
      await fs.rm(this.#getDir(File), {
        recursive: true,
        force: true
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  async writeFile(File: string, content: string | Buffer): Promise<boolean> {
    try {
      await fs.writeFile(this.#getDir(File), content, {
        encoding: 'utf-8'
      });
      return true;
    } catch (err) {
      return false;
    }
  }

  async readFile(File: string, opt?: any): Promise<any> {
    return await utils.readFile(this.#getDir(File), opt);
  }

  async readdir(Dir: string): Promise<string[]> {
    return await fs.readdir(this.#getDir(Dir));
  }
}