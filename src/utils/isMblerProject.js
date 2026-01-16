const FileExsit = require('./FileExsit')
const path = require('path')
const BuildConfig = require('./../build/build-g-config.json')
module.exports = async (Dir) => {
  const rel = await Promise.all([
    path.join(Dir, "package.json"),
    path.join(Dir, BuildConfig.PackageFile)
  ].map(FileExsit)).catch((e) => console.log(e.stack) || [false, false]);
  const res = rel.every(Boolean);
  return res
}