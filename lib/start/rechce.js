const fs = require('fs/promises')
const lang = require('./../lang')
module.exports = async function(dirname, workDir) {
  await Promise.all([
    fs.rm(path.join(dirname, "lib/data"), {
      recursive: true,
      force: true
    }).catch(() => {}), fs.rm(path.join(dirname, "lib/initializer-cache/"), {
      recursive: true,
      force: true
    }).catch(() => {})
  ])
  console.log(lang.s0)
}