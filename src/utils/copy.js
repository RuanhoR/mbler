const fs =  require('fs/promises')
const loger = require('./../loger')
const waitGC = require('./waitGC')
module.exports = async function(src, out) {
  await waitGC()
  try {
    await fs.cp(src, out, {
      force: true,
      recursive: true
    })
  } catch (err) {}
  await waitGC()
}