const path = require('path')
const fs = require('fs/promises')
const utils = require('./../utils')
const buildConfig = require('./../build/build-g-config.json')
let dirname;
module.exports = class {
  constructor(dir, baseDir) {
    dirname = baseDir;
    this.dir = dir
    this.two = process.argv[3] || '';
    this.start();
  }
  async start() {
    const workDir = utils.join(dirname, this.dir);
    const mblerConfig = await utils.GetData(workDir)
    const packager = await utils.readFile(path.join(workDir, 'package.json'), {
      want: 'object'
    })
    if (typeof this.two === 'string' && utils.isVersion(this.two)) {
      packager.version = this.two;
      mblerConfig.version = this.two;
    }
    console.log(`当前工作目录包版本：${mblerConfig.version || '未指定版本'}`)
    await Promise.all([
      this.write(
        path.join(workDir, buildConfig.PackageFile),
        mblerConfig
      ),
      this.write(
        path.join(workDir, 'package.json'),
        packager
      )
    ])
  }
  write(p, c) {
    return fs.writeFile(p,
      JSON.stringify(c, null, 2)
    )
  }
}