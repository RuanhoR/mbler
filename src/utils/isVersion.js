const source = /\d+\.\d+\.\d+/
module.exports = function(str) {
  return source.test(str)
}
module.exports.source = source
Object.defineProperty(module.exports, 'source' , {
  enumerable: false,
  writable: false
});