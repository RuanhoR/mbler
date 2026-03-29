import { mkdir, stat, writeFile, readFile, unlink } from "node:fs/promises";
import { homedir } from "node:os";
import i18n from "./../i18n";
import path from "node:path";
import { FileExsit } from "../utils";
import Logger from "../logger";
import { cwd } from "node:process";
async function tryMkdir(point: string): Promise<boolean> {
  try {
    await mkdir(point);
    return true;
  } catch {
    return false;
  }
}
export default class WorkDirManage {
  private currentWorkPoint: string | null = null;
  private enabledPath = path.join(homedir(), ".cache/mbler/workdir_enabled.db");
  constructor(
    private cacheDir: string = path.join(homedir(), ".cache/mbler/mp.db"),
  ) { }
  async isDisabled(): Promise<boolean> {
    try {
      await readFile(this.enabledPath, "utf-8");
      return false; // 文件存在，表示启用
    } catch {
      return true; // 文件不存在，默认禁用
    }
  }
  async setDisabled(disabled: boolean): Promise<void> {
    if (!disabled) {
      // 启用：创建文件
      await writeFile(this.enabledPath, "1", { encoding: "utf-8" });
    } else {
      try {
        await unlink(this.enabledPath);
      } catch {
        // 文件不存在，忽略
      }
    }
  }
  async set(newPointDir: string): Promise<string> {
    // check
    try {
      const s = await stat(newPointDir);
      if (!s.isDirectory()) {
        throw new Error("Not Dir (0xcvb)");
      }
    } catch (err: any) {
      const code = err.code;
      if (err.message && err.message.includes("0xcvb"))
        return i18n.workdir.nfound;
      if (code == "ENOENT") {
        const res = tryMkdir(newPointDir);
        if (!res) {
          return i18n.workdir.nfound;
        }
      }
    }
    try {
      if (!(await FileExsit(path.dirname(this.cacheDir)))) {
        const isC = await tryMkdir(path.dirname(this.cacheDir));
        if (!isC) return i18n.workdir.nfound;
      }
      await writeFile(this.cacheDir, newPointDir, {
        encoding: "utf-8",
      });
    } catch (err: any) {
      Logger.e("WorkDir", err.stack);
    }
    return i18n.workdir.set + newPointDir;
  }
  async get() {
    if (await this.isDisabled()) {
      return cwd();
    }
    if (this.currentWorkPoint) {
      return this.currentWorkPoint;
    }
    const file = await readFile(this.cacheDir, "utf-8").catch((e) => {
      this.set(cwd());
      return cwd();
    });
    return (this.currentWorkPoint = file);
  }
}
