const FileExsit = require('./FileExsit')
const path = require('path')
const BuildConfig = require('./../build/build-g-config.json')
module.exports = async (Dir) => {
  const rel = await Promise.all([
    path.join(Dir, "package.json"),
    path.join(Dir, BuildConfig.PackageFile)
  ].map(FileExsit));
  return rel.every(Boolean)
}