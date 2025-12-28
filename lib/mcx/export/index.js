module.exports = {
  MCxLoad: require('./../mcxLoad'),
  TAG_AST: require('./../ast')
}
Object.setPrototypeOf(module.exports, null);
const testAst = new module.exports.MCxLoad(require("path").dirname(__dirname))
testAst.run().then(()=>console.log(testAst))