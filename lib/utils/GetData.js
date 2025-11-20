const {
  join
} = require('path')
const fs = require('fs/promises')
const config = require('./../build/build-g-config.json')
const JSONparse = require('./JSONparse.js')
const waitGC = require('./waitGC.js')
module.exports = async function(path) {
  const configPath = join(path, config.PackageFile);
  await waitGC()
  try {
    const fileContent = await fs.readFile(configPath, 'utf-8')
    return JSONparse(fileContent);
  } catch (err) {
    return {}
  }
}