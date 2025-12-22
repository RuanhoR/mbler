const fs = require('fs/promises')
const lang = require('./../lang')
const path = require('path');
module.exports = async function(dirname, workDir) {
  await Promise.all([
    fs.rm(path.join(dirname, "lib/data/path.db"), {
      recursive: true,
      force: true
    }).catch(() => {}), fs.rm(path.join(dirname, "lib/initializer-cache/"), {
      recursive: true,
      force: true
    }).catch(() => {})
  ])
  console.log(lang.s0)
}