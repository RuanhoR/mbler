import path, { isAbsolute } from "node:path"
import type { CliParam, MblerConfigData } from "../types";
import { FileExsit, ReadProjectMblerConfig } from "../utils";
import Logger from "../logger";
import { showText } from "../cli";
import { readdir } from "node:fs/promises";
import { BuildConfig } from "./config";

class Build {
  currentConfig: MblerConfigData | null = null;
  srcDirs: {
    [key in "behavior" | "res"]: string;
  } | null = null;
  constructor(opts: Record<string, string>, private baseBuildDir: string, private resolve: ((a: number) => void)) {}
  public start() {
    return this.build().catch(e=>{
      if (e instanceof Error) {
        Logger.e("Build", e.stack || e.message);
      } else {
        Logger.e("Build", e)
      }
      showText("MBLER__ERR__BUILD: " + e + " Log at " + Logger.LogFile);
      this.resolve(1);
    });
  }
  private async build() {
    if (!isAbsolute(this.baseBuildDir)) {
      throw new Error("[init build]: build dir is not absolute path");
    }
    this.currentConfig = await ReadProjectMblerConfig(this.baseBuildDir);
    this.loadData();
    await this.handlerOtherAddon();
    const lang = this.currentConfig.script?.lang || "js";
  }
  private loadData() {
    if (!this.currentConfig || !this.baseBuildDir || this.srcDirs) throw new Error("[build data]: can't resolve again");
    this.srcDirs = {
      behavior: path.join(this.baseBuildDir, BuildConfig.behavior),
      res: path.join(this.baseBuildDir, BuildConfig.resources)  // res
    };
  }
  private async handlerOtherAddon() {
    if (!this.srcDirs) throw new Error("[build addon]: can't first can this method")
    const isHasBp = await FileExsit(this.srcDirs.behavior);
    if (!isHasBp) throw new Error("[build addon]: can't resolve behavior");
    for (const file of await readdir(this.srcDirs.behavior, {
      withFileTypes: true
    })) {
      if (file.isDirectory()) {
      }
    }
  }
}
function build(cliParam: CliParam, work: string) {
  return new Promise<number>((resolve) => {
    (new Build(cliParam.opts, work, resolve)).start()
  });
}
export {
  Build,
  build
}