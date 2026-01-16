const tree = require('./mtreehandler.js')
module.exports = function(text) {
  if (typeof text !== 'string') return new tree(null)
  return new tree(text)
}