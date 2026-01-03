const PrototypeContext = require("./context")
const {
  SpecifierAllTag
} = require("./tag")
const path = require("node:path");
const fs = require("fs")
class JSCompiler {
  context;
  config;
  /**
   * 按照mcx的逻辑编译一个项目中的js，传入 ./context 的实例
   * @param {*} context 
   */
  constructor(context, config) {
    if (!(context instanceof PrototypeContext)) throw new TypeError("context is not ProtoypeContext")
    this.config = config;
    this.context = context;
  }
  ImportDeclaration(path) {
    const node = path.node;
    this.checkModule();
    // 先删掉，主入口部分要放到function内
    path.remove();
  }
  checkModule(node) {
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

    const dir = path.parse(source);
    let modulePath;
    // 如果path无法识别，那么就是模块名称
    if (dir.dir === "") {
      // 如果是模块名称，那么就在node_modules中保存
      modulePath = path.join(this.config.buildDir, "node_modules", source);
    } else {
      if (dir.dir === "/") {
        modulePath = source;
      } else {
        modulePath = path.join(this.config.filename, sourrce);
      }
    }

    imports.forEach(item => {
      if (this.context.import[item.as]) throw new Error(`[check import Error] from ${modulePath} import ${source} Naming conflict`);
      this.context.import[item.as] = {
        type: "import",
        modulePath,
        import: item.source,
        ext: dir.ext
      };
    });
  }
  CallExpression(path) {
    const call = this.getCallObject(path);
    // 宏不可能是变量定义产生的
    const source = this.context.import[call[0]];
    // 即使导入项为解析，也应该存在（import语句标准应该在前面，也就是在遍历Call之前就被遍历到了）
    if (!source) return;
    // 由于这里没对导入对象做进一步分析，宏下一步判断
    this.context.callList.push({
      call,
      remove: () => path.remove()
    });
  }
  /**
   * 解析 Babel CallExpression 节点，返回调用函数的路径，如 ["console", "log"] 或 ["func"]
   * @param {import('@babel/types').CallExpression} callNode - Babel 的 CallExpression AST 节点
   * @returns {string[]} 如 ["console", "log"] 或 ["func"]
   */
  getCallObject(node) {
    function getFunctionCallPath(callNode) {
      if (!callNode || callNode.type !== 'CallExpression') {
        throw new Error('Expected a Babel CallExpression node');
      }
      const callee = callNode.callee;
      if (callee.type === 'Identifier') {
        return [callee.name];
      }
      if (callee.type === 'MemberExpression') {
        const parts = [];
        let obj = callee.object;
        while (obj.type === 'MemberExpression') {
          parts.unshift(getIdentifierName(obj.property));
          obj = obj.object;
        }
        if (obj.type === 'Identifier') {
          parts.unshift(obj.name);
        } else {
          parts.unshift('?')
        }
        parts.push(getIdentifierName(callee.property));
        return parts;
      }
      return ['?'];
    }

    /**
     * 辅助函数：从 Identifier 节点获取 name
     * @param {import('@babel/types').Identifier} node
     * @returns {string}
     */
    function getIdentifierName(node) {
      if (node && node.type === 'Identifier') {
        return node.name;
      }
      return '';
    }
    return getFunctionCallPath(node);
  }
}
module.exports = JSCompiler;