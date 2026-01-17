import * as fs from 'fs/promises';
import * as utils from './../utils/index.js';
import logger from './../loger/index.js';
import * as path from 'path';
import * as lang from './../lang/index.js';

class Clean {
  p: string;
  dirname: string;
  outdir: string[] = [];

  constructor(p: string, baseDir: string) {
    this.p = p;
    this.dirname = baseDir;
  }

  run = (): Promise<void> => this.start().catch((err) => {
    logger.e(err);
  });

  async start(): Promise<void> {
    if (!await utils.FileExsit(this.p)) {
      utils.Exit(`项目不存在`);
    }
    // 获取 mbler.config.json
    try {
      const packager = await utils.GetData(this.p);
      // 提取输出目录
      this.outdir = [
        /*resources*/
        this.getOutDir(packager.outdir?.resources),
        /*behavior*/
        this.getOutDir(packager.outdir?.behavior)
      ];
      await Promise.all(this.outdir.map((dir) => fs.rm(dir, {
        recursive: true,
        force: true
      }).catch(() => {})));
    } catch (err) {
      logger.e('clean', err as Error);
    }
    logger.i('clean', lang.cleanFinally);
  }

  getOutDir(dir: string | undefined): string {
    const outdir = dir;
    return outdir ? utils.join(this.p, outdir) : path.join(this.p, 'dist');
  }
}

export default Clean;