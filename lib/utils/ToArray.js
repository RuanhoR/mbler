const isVersion = require('./isVersion.js')
const Exit = require('./Exit.js')
module.exports = function(str) {
  if (!isVersion(str)) Exit('版本号非三位 x.x.x 格式')
  return str.split(`.`).map(Number);
}