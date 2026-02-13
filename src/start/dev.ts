import * as path from "path";
import * as chokidar from "chokidar";
import Build from "./../build/index.js";
import logger from "./../loger/index.js";
import * as utils from "./../utils/index.js";
import lang from "./../lang/index.js";

class Dev {
  cwd: string;
  baseDir: string;
  build: Build;
  isBuilding: boolean = false;
  pending: boolean = false;

  constructor(cwd: string, baseDir: string) {
    this.cwd = cwd;
    this.baseDir = baseDir;
    this.build = new Build(cwd, baseDir);
  }

  async start(): Promise<void> {
    logger.i("Dev", lang.dev?.start || "开始即时监听构建");
    await this.build.build();
    this.startWatcher();
  }

  startWatcher(): void {
    const watchPath = this.cwd;
    // load project config to determine output folders to ignore
    (async () => {
      let extraIgnored: string[] = [];
      try {
        const baseCwd = path.isAbsolute(this.cwd) ? this.cwd : path.join(this.baseDir, this.cwd);
        const data: any = await utils.GetData(baseCwd).catch(() => ({}));
        if (data && typeof data === 'object') {
          // behavior outdir
          if (data.outdir && data.outdir.behavior) {
            extraIgnored.push(path.join(baseCwd, data.outdir.behavior, "**"));
          } else {
            extraIgnored.push(path.join(baseCwd, "dist/dep", "**"));
          }
          // resources outdir
          if (data.outdir && data.outdir.resources) {
            extraIgnored.push(path.join(baseCwd, data.outdir.resources, "**"));
          } else {
            extraIgnored.push(path.join(baseCwd, "dist/res", "**"));
          }
          // dist file (archive)
          if (data.outdir && data.outdir.dist) {
            extraIgnored.push(path.join(baseCwd, data.outdir.dist));
          }
        }
      } catch (e) {
        // ignore errors and continue with defaults
      }

      const watcher = chokidar.watch(watchPath, {
        ignoreInitial: true,
        ignored: [
          "**/dist/**",
          "**/.git/**",
          "**/node_modules/**",
          "**/lib/data/cache/**",
          "dist/**",
          ...extraIgnored,
        ],
        persistent: true,
        usePolling: true,
        interval: 150,
      });
      watcher.on("all", async (event: string, filePath: string) => {
      logger.i("Dev", `${lang.dev?.tip || "监听到变化"} ${event} ${filePath}`);
      if (this.isBuilding) {
        this.pending = true;
        return;
      }
      await this.rebuild();
      });
    })();
  }

  async rebuild(): Promise<void> {
    this.isBuilding = true;
    try {
      logger.i("Dev", lang.dev?.start_d || "开始增量构建");
      await this.build.build();
    } catch (err) {
      logger.e("Dev", (lang.err_bulid || "构建错误") + utils.toString(err));
    }

    this.isBuilding = false;

    if (this.pending) {
      this.pending = false;
      await this.rebuild();
    }
  }
}

export = async (workDir: string, baseDir: string): Promise<void> =>
  new Dev(workDir, baseDir).start();
