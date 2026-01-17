import * as path from 'path';
import * as fs from 'fs/promises';
import * as utils from './../utils/index.js';
import buildConfig from './../build/build-g-config.json';
import * as lang from './../lang';

let dirname: string = '';

class Version {
  dir: string;
  baseDir: string;
  two: string;

  constructor(dir: string, baseDir: string) {
    dirname = baseDir;
    this.dir = dir;
    this.two = process.argv[3] || '';
  }

  async start(): Promise<void> {
    const workDir = utils.join(dirname, this.dir);
    const mblerConfig = await utils.GetData(workDir);
    const packager = await utils.readFile(path.join(workDir, 'package.json'), {
      want: 'object'
    }) as Record<string, unknown>;
    if (typeof this.two === 'string' && utils.isVerison(this.two)) {
      packager.version = this.two;
      mblerConfig.version = this.two;
    }
    console.log(`${lang.workPackV} ${mblerConfig.version || '0.0.1'}`);
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

  write(p: string, c: Record<string, unknown>): Promise<void> {
    return fs.writeFile(p,
      JSON.stringify(c, null, 2)
    );
  }
}

export = Version;