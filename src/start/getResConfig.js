const path = require('path')
const utils = require('./../utils')
const cache = new Map();
module.exports = async function (dirname) {
  cache.set('Mod', await utils.readFile(
    path.join(dirname, './lib/modules/contents.json'), {
      want: 'object'
    }
  ))
  cache.set('innerDef', await utils.readFile(
    path.join(dirname, './lib/modules/innerDef.json'), {
      want: 'object'
    }
  ))
  return cache
}