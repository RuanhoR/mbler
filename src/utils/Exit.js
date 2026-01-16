const logger = require('./../loger')
module.exports = function(msg) {
  logger.e('ERROR', msg);
  process.exit(1)
}