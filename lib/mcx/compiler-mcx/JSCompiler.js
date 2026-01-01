const PrototypeContext = require("./context")
const {
  SpecifierAllTag
} = require("./tag")
class JSCompiler {
  context;
  /**
   * 按照mcx的逻辑编译一个项目中的js，传入 ./context 的实例
   * @param {*} context 
   */
  constructor(context) {
    if (!(context instanceof PrototypeContext)) throw new TypeError("context is not ProtoypeContext")
    this.context = context;
  }
  ImportDeclaration(path) {
    const node = path.node;
    this.checkModule();
  }
  async checkModule(node) {
    const source = node.source.value;
    if (typeof source !== "string") throw new TypeError("this is not a Babel ast");
    const imports = node.specifiers.map((item) => {
      const to = item.local.name;
      if (item.type === "ImportDefaultSpecifier") return {
        source: "default",
        as: to
      };
      if (item.type === "ImportNamespaceSpecifier") return {
        source: new SpecifierAllTag(),
        as: to
      }
      return {
        source: item.imported.name,
        as: to
      }
    });

  }
}
module.exports = JSCompiler;