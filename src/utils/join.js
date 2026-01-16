const path = require('path')
module.exports = function(baseDir, inputPath) {
  return path.isAbsolute(inputPath) ? 
    inputPath : 
    path.join(baseDir, inputPath);
}