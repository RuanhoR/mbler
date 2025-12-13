const loger = require('./../loger')
const path = require('path')
const utils = require('./../utils')
const fs = require('fs/promises')
let dirname;
let cache;
module.exports = async function Uninstall(
  packName,
  dirname_
) {
  dirname = dirname_;
  try {
    const cache = await (require('./getResConfig.js'))()
    const mods = cache.get('Mod')
    let find = false;
    for (let [index, item] of mods.entries()) {
      if (item.name !== packName || item.git === 'inner') continue;
      mods.splice(index, 1)
      find = true;
      // 删除依赖
      await fs.rm(
        path.join(
          dirname, 'lib/modules', item.name
        ), {
          recursive: true,
          force: true
        })
      break;
    }
    if (!find) throw new Error('未安装此包')
  } catch (err) {
    loger.e('uninstall', err.message)
  }
}