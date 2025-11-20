// lib/start/dev.js

const path = require("path");
const chokidar = require("chokidar");
const Build = require("./../build");
const logger = require("./../loger");
const utils = require("./../utils");
const ts = require("typescript");

class Dev {
  constructor(cwd, baseDir) {
    this.cwd = cwd;
    this.baseDir = baseDir;
    this.build = new Build(cwd, baseDir);

    this.isBuilding = false;
    this.pending = false;
  }

  async start() {
    logger.i("Dev", "初始化开发模式...");
    logger.i("Dev", "正在进行第一次完整构建...");
    await this.build.build();
    logger.i("Dev", "初次构建完成，进入监听模式。\n");

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
      logger.i("Dev", `检测到文件变化: ${event} ${filePath}`);

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
      logger.i("Dev", "开始增量构建...");
      await this.build.build(); // 可换成你未来的 “增量编译”
      logger.i("Dev", "增量构建成功\n");

    } catch (err) {
      logger.e("Dev", "构建失败，不退出 dev 模式：\n" + utils.toString(err));
    }

    this.isBuilding = false;

    if (this.pending) {
      this.pending = false;
      await this.rebuild();
    }
  }
}

module.exports = async (workDir, baseDir) => new Dev(workDir, baseDir).start();