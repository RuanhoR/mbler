const path = require("path");
const parser = require("@babel/parser");
const generator = require("@babel/generator");
const utils = require("./../utlis")
const InitContext = require("./context")
const traverse = require('@babel/traverse').default;
const Filedata = require("./Filedata")
const fs = require("fs");
const buildConfig = require("./../../build/build-g-config.json")
const JSCompiler = require("./JSCompiler")
class Compile {
  static defaultOpt = {
    main: null,
    project: null,
    context: {},
    outdir: null,
    desList: []
  }
  static defaultParserOpt = {
    sourceType: "module",
    allowImportExportEverywhere: true,
    createParenthesizedExpressions: false,
    attachComment: false
  }
  cache = new Map();
  Project;
  main;
  context;
  constructor(opt_) {
    const opt = {
      ...opt_,
      ...Compile.defaultOpt
    };
    this.Project = opt.project;
    // main在index中已经被合并了，不用再path.join
    this.main = opt.main;
    this.desList = opt.desList;
    this.outdir = opt.outdir;
    if (!(typeof this.Project === "string" && typeof this.main === "string")) {
      throw new TypeError("Err : input format is not right");
    }
  }
  async start() {
    // 先检查文件可用性
    if (!await utils.FileExsit(this.main)) throw new Error("Not Found main (MCX COMPILER)");
    const indexCode = await utlis.readFile(this.main);
    const indexAst = parser.parse(indexCode, Compile.defaultParserOpt);
    const context = new InitContext();
    traverse(indexAst, new JSCompiler(context));
  }
  checkImport(node, context) {
    // 锁定节点的类型
    if (node.type !== "ImportDeclaration") return;
    const source = node.source.value;
    const names = node.specifiers.map(item => {
      if (item.type === 'ImportDefaultSpecifier') return {
        source: "default",
        to: item.name
      }
      if (item.type === "ImportNamespaceSpecifier") return {
        source: {
          __all: true
        },
        to: item.local.name
      };
      return {
        source: item.imported.name,
        to: item.local.name
      }
    });
    let data;
    // 如果是相对，加载进上下文
    if (source.startsWith("./")) {
      const filename = path.join(path.dirname(this.main), source);
      if (await utils.FileExsit(filename)) {
        const filedata = await utils.readFile(filename);
        data = new Filedata(filedata);
      } else {
        throw new Error(`Cannot find module ${source}`);
      }
    } else if (desList.includes(source)) {
      // 如果依赖列表包含导入源，那么前面一定复制了
      const moduleDir = path.join(this.Project, "scripts", "node_modules", source);
      const Main = this.getFromCacheModuleMain(source);

    }
    names.forEach((item) => {
      if (context[item.to]) throw new Error("You shouldn't import, because this var is used.");
      context[item.to] = {
        ast: data,
        export: item.source
      };
    });
  }
  getFromCacheModuleMain(source) {
    if (this.cache.has(source)) {
      return this.cache.get(source);
    } else {
      const config = fs.readFileSync(path.join(moduleDir, buildConfig.PackageFile), "utf-8");
      this.cache.set(source, JSON.parse(config).script?.main);
      return this.cache.get(source)
    }
  }
}
module.exports = Compile;