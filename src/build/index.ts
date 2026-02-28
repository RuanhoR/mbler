import path, { isAbsolute } from "node:path";
import type { CliParam, MblerConfigData } from "../types";
import { FileExsit, join, ReadProjectMblerConfig, writeJSON } from "../utils";
import Logger from "../logger";
import { showText } from "../cli";
import * as fs from "node:fs/promises";
import { BuildConfig } from "./config";
import generateManifest from "./manifest";

class Build {
  currentConfig: MblerConfigData | null = null;
  srcDirs:
    | {
        [key in "behavior" | "resources"]: string;
      }
    | null = null;
  outdirs:
    | {
        [key in "behavior" | "resources" | "dist"]: string;
      }
    | null = null;
  constructor(
    opts: Record<string, string>,
    private baseBuildDir: string,
    private resolve: (a: number) => void,
  ) {}
  public start() {
    return this.build().catch((e) => {
      if (e instanceof Error) {
        Logger.e("Build", e.stack || e.message);
      } else {
        Logger.e("Build", e);
      }
      showText("MBLER__ERR__BUILD: " + e + " Log at " + Logger.LogFile);
      this.resolve(1);
    });
  }
  init: boolean = false;
  module: "behavior" | "resoucres" | "all" | null = null;
  private async fileType(filePath: string): Promise<"file" | "directory"> {
    const stat = await fs.lstat(filePath);
    if (stat.isFile()) {
      return "file";
    }
    if (stat.isDirectory()) {
      return "directory";
    }
    if (stat.isSymbolicLink()) {
      return await this.fileType(await fs.readlink(filePath));
    }
    throw new Error("[build addon]: invaild file type");
  }
  private async build() {
    this.init = true;
    if (!isAbsolute(this.baseBuildDir)) {
      throw new Error("[init build]: build dir is not absolute path");
    }
    this.currentConfig = await ReadProjectMblerConfig(this.baseBuildDir);
    this.loadData();
    await this.handlerOtherAddon();
  }
  public async watch() {
    // init build
    if (!this.init) {
      await this.build();
    }
    this.createWatcher();
  }
  private createWatcher() {
    if (!this.srcDirs || !this.outdirs)
      throw new Error(`[build addon]: can't first can this method`);
  }
  private async handlerManifest() {
    if (!this.currentConfig || !this.outdirs || !this.srcDirs || !this.module)
      throw new Error(`[build addon]: can't first can this method`);
    const otherManifestOption: {
      behavior: any;
      resources: any;
    } = {
      behavior: {},
      resources: {},
    };
    const handlerBP = async () => {
      if (!this.outdirs || !this.currentConfig)
        throw new Error(`[build addon]: can't first can this method`);
      const manifest = await generateManifest(this.currentConfig, "data");
      await writeJSON(path.join(this.outdirs.behavior, "manifest.json"), {
        ...manifest,
        ...otherManifestOption.behavior,
      });
    };
    const handlerRP = async () => {
      if (!this.outdirs || !this.currentConfig)
        throw new Error(`[build addon]: can't first can this method`);
      const manifest = await generateManifest(this.currentConfig, "resources");
      await writeJSON(path.join(this.outdirs.resources, "manifest.json"), {
        ...manifest,
        ...otherManifestOption.resources,
      });
    };
    if (this.module == "behavior" || this.module == "all") {
      const filePath = path.join(this.srcDirs.behavior, "manifest.json");
      if (await FileExsit(filePath)) {
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const json = JSON.parse(content);
          otherManifestOption.behavior = json;
          await handlerBP();
        } catch (err) {
          Logger.w("Build", "invalid manifest.json in behavior");
        }
      }
    }
    if (this.module == "resoucres" || this.module == "all") {
      const filePath = path.join(this.srcDirs.resources, "manifest.json");
      if (await FileExsit(filePath)) {
        try {
          const content = await fs.readFile(filePath, "utf-8");
          const json = JSON.parse(content);
          otherManifestOption.resources = json;
          await handlerRP();
        } catch (err) {
          Logger.w("Build", "invalid manifest.json in resources");
        }
      }
    }
  }
  private loadData() {
    // check run time
    if (!this.currentConfig || !this.baseBuildDir || this.srcDirs)
      throw new Error("[build data]: can't resolve again");
    // source code dir
    this.srcDirs = {
      behavior: path.join(this.baseBuildDir, BuildConfig.behavior),
      resources: path.join(this.baseBuildDir, BuildConfig.resources), // res
    };
    // output dir
    this.outdirs = {
      behavior: this.currentConfig.outdir?.behavior
        ? join(this.baseBuildDir, this.currentConfig.outdir.behavior)
        : path.join(this.baseBuildDir, "dist/dep"),
      resources: this.currentConfig.outdir?.resources
        ? join(this.baseBuildDir, this.currentConfig.outdir.resources)
        : path.join(this.baseBuildDir, "dist/res"),
      dist: this.currentConfig.outdir?.dist
        ? join(this.baseBuildDir, this.currentConfig.outdir.dist)
        : path.join(this.baseBuildDir, "dist-pkg"),
    };
  }
  private async handlerOtherAddon() {
    if (!this.srcDirs)
      throw new Error("[build addon]: can't first can this method");
    const isHasBp = await FileExsit(this.srcDirs.behavior);
    if (!isHasBp) throw new Error("[build addon]: can't resolve behavior");
    // init copy resources
    const handlerBP = async () => {
      if (!this.srcDirs || !this.outdirs)
        throw new Error("[build addon]: can't first can this method");
      for (const f of await fs.readdir(this.srcDirs.behavior)) {
        const fType = await this.fileType(f);
        const includeType = BuildConfig.includes.behavior[f];
        if (includeType == fType) {
          await fs.cp(
            path.join(this.srcDirs.behavior, f),
            path.join(this.outdirs.behavior, f),
            {
              recursive: true,
              force: true,
            },
          );
        } else if (includeType == "skip") {
          continue;
        } else {
          throw new Error(
            `[build addon]: invaild file: ${path.join(this.srcDirs.behavior, f)}: type: ${fType}`,
          );
        }
      }
    };
    const handlerRP = async () => {
      if (!this.srcDirs || !this.outdirs)
        throw new Error("[build addon]: can't first can this method");
      for (const f of await fs.readdir(this.srcDirs.resources)) {
        const fType = await this.fileType(f);
        const includeType = BuildConfig.includes.resources[f];
        if (includeType == fType) {
          await fs.cp(
            path.join(this.srcDirs.resources, f),
            path.join(this.outdirs.resources, f),
            {
              recursive: true,
              force: true,
            },
          );
        } else if (includeType == "skip") {
          continue;
        } else {
          throw new Error(
            `[build addon]: invaild file: ${path.join(this.srcDirs.resources, f)}: type: ${fType}`,
          );
        }
      }
    };
    const tasks: Promise<void>[] = [];
    if (await FileExsit(this.srcDirs.behavior)) {
      this.module = "behavior";
      tasks.push(handlerBP());
    }
    if (await FileExsit(this.srcDirs.resources)) {
      if (this.module == "behavior") {
        this.module = "all";
      } else {
        this.module = "resoucres";
      }
      tasks.push(handlerRP());
    }
    if (!this.module) {
      throw new Error(
        "[build addon]: couldn't resolve source code(your behaivor or reources code is not found)",
      );
    }
    await Promise.all(tasks);
  }
}
function build(cliParam: CliParam, work: string): Promise<number> {
  return new Promise<number>((resolve) => {
    new Build(cliParam.opts, work, resolve).start();
  });
}
function watch(cliParam: CliParam, work: string): Promise<number> {
  return new Promise<number>((resolve, reject) => {
    try {
      const build = new Build(cliParam.opts, work, resolve);
      build.start().then(() => {
        build.watch();
      });
    } catch (err) {
      if (err instanceof Error) {
        reject(`[watcher]: error ${err.stack || err.message}`);
      } else {
        reject(err);
      }
    }
  });
}
export { build, watch };
export default Build;
