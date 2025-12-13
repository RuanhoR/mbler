const path = require("path");
const chokidar = require("chokidar");
const Build = require("./../build");
const logger = require("./../loger");
const utils = require("./../utils");
const ts = require("typescript");
const lang = require('./../lang')
class Dev {
  constructor(cwd, baseDir) {
    this.cwd = cwd;
    this.baseDir = baseDir;
    this.build = new Build(cwd, baseDir);
    this.isBuilding = false;
    this.pending = false;
  }
  async start() {
    logger.i("Dev", lang.dev.start);
    await this.build.build();
    this.startWatcher();
  }

  startWatcher() {
    const watchPath = this.cwd;
    const watcher = chokidar.watch(watchPath, {
      ignoreInitial: true,
      ignored: [
        "**/dist/**",
        "**/.git/**",
        "**/node_modules/**",
        "**/lib/data/cache/**"
      ],
      persistent: true,
      usePolling: true,
      interval: 150
    });
    watcher.on("all", async (event, filePath) => {
      logger.i("Dev", `${lang.dev.tip} ${event} ${filePath}`);
      if (this.isBuilding) {
        this.pending = true;
        return;
      }
      await this.rebuild();
    });
  }
  async rebuild() {
    this.isBuilding = true;
    try {
      logger.i("Dev", lamg.dev.start_d);
      await this.build.build();
    } catch (err) {
      logger.e("Dev", lang.err_bulid + utils.toString(err));
    }

    this.isBuilding = false;

    if (this.pending) {
      this.pending = false;
      await this.rebuild();
    }
  }
}

module.exports = async (workDir, baseDir) => new Dev(workDir, baseDir).start();