module.exports = {
  MCxLoad: require('./../mcxLoad'),
  TAG_AST: require('./../ast')
}
Object.setPrototypeOf(module.exports, null);
const testAst = new module.exports.MCxLoad("<Event href=PlayerJoin></Event>  <script>console.log('Hello world')</script>")
console.log(testAst.data)