const path = require("node:path");
const parser = require("@babel/parser");
const utils = require("./../utils")
const InitContext = require("./context")
const traverse = require('@babel/traverse').default;
const FileCompile = require("./FileCompile")
const fs = require("fs/promises");
const buildConfig = require("./../../build/build-g-config.json")
const JSCompiler = require("./JSCompiler")
const generator = require("@babel/generator");
const ERRORS = require("./../errors")
const CompileModule = require("./FileCompile")
const macros = require("./macroList")
class Compile {
  static defaultOpt = {
    main: null,
    project: null,
    outdir: null,
    desList: []
  }
  static defaultParserOpt = {
    sourceType: "module",
    allowImportExportEverywhere: true,
    createParenthesizedExpressions: false,
    attachComment: false
  }
  buildDir;
  main;
  constructor(opt_) {
    const opt = {
      ...opt_,
      ...Compile.defaultOpt
    };

    this.buildDir = opt.buildDir;
    this.main = opt.main;
    this.output = opt.output;
    this.filename = this.main;
    this.compileFileAst = [];
    this.BabelOpt = {
      ...Compile.defaultParserOpt,
      ...opt.BabelOpt
    };
    if (!typeof this.buildDir === "string" || !typeof this.main === "string") {
      throw new TypeError("Err : input format is not right");
    }
  }
  async start() {
    // 先检查文件可用性
    if (!await utils.FileExsit(this.main)) throw new Error("Not Found main (MCX COMPILER)");
    const indexCode = await utlis.readFile(this.main);
    const indexAst = parser.parse(indexCode, this.BabelOpt);
    const context = new InitContext();
    traverse(indexAst, new JSCompiler(context, this));
    // 这里JSCompiler会把数据写入context，直接用
    await this.ForImport(context.import);
    await this.ForCallList(context);
  }
  async ForCallList(context) {
    const CallList = context.callList;
    if (CallList < 1) return;
    for (let i of CallList) {
      // 判断是否为宏
      const property = i.call.slice(1).join(".");
      const source = context.import[i.call[0]];
      const found = macros.find(item => !(source instanceof item.prototype) || property === item )
      
      if (found && typeof found.handler === "function") {
        await Promise.resolve(found.handler(source, this.compileFileAst))
      }
    }
  }
  async ForImport(importData) {
    if (!importData) return;
    const moduleCache = new Map();
    for (let [key, value] of Object.entries(importData)) {
      if (moduleCache.has(key)) {
        importData[key] = {
          source: moduleCache[key],
          import: value.import
        };
        return;
      }
      const CompileCode = FileCompile(value.modulePath);
      moduleCache.set(key, CompileCode);
      importData[key] = {
        source: CompileCode,
        import: value.import
      };
    }
  }
  Deconstruct(code) {
    const r = {
      script: {},
      Event: {},
      Component: {}
    };
    const arrs = Object.keys(r)
    for (let el of (new AST_tag(code)).generateAst();) {
      if (arrs.includes(el.name)) r[el.name] = el;
    };
    if (r.script?.content === void 0) throw ERRORS.nosc
    return r;
  }
}
module.exports = Compile;