import * as path from 'path';
import * as fs from 'fs/promises';
import * as utils from './../utils/index.js';
import buildConfig from './../build/build-g-config.json';
import lang from './../lang/index.js';

let dirname: string = '';

class Version {
  dir: string;
  baseDir!: string;
  two: string;

  constructor(dir: string, baseDir: string) {
    dirname = baseDir;
    this.dir = dir;
    this.two = process.argv[3] || '';
  }

  async start(): Promise<void> {
    const workDir = utils.join(dirname, this.dir);
    const mblerConfig = await utils.GetData(workDir);
    const packager = JSON.parse(await fs.readFile(path.join(workDir, 'package.json'), {
      encoding: 'utf-8'
    }).catch(() => ("{}"))) as Record<string, unknown>;
    if (typeof this.two === 'string' && utils.isVerison(this.two)) {
      packager.version = this.two;
      mblerConfig.version = this.two;
    }
    console.log(`${lang.workPackV || '当前工作目录包版本：'} ${mblerConfig.version || '0.0.1'}`);
    await Promise.all([
      this.write(
        path.join(workDir, buildConfig.PackageFile),
        mblerConfig
      ),
      this.write(
        path.join(workDir, 'package.json'),
        packager
      )
    ]);
  }

  write(p: string, c: any): Promise<void> {
    return fs.writeFile(p,
      JSON.stringify(c, null, 2)
    );
  }
}

export = Version;