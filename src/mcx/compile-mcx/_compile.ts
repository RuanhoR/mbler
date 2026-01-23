import Context, {
  InfoCompile
} from "./context.js";
import type {
  BuildCache,
  ImportList,
  ImportListImport,
  CompileOpt
} from "./types.js"
import {
  parse,
  type ParserOptions
} from "@babel/parser"
import Parser from "@babel/parser"
import * as t from "@babel/types"
import McxAST from "./../ast/index.js"
import {
  type ImportDeclaration,
  type Node,
  type Program,
  type Identifier,
  type StringLiteral
} from "@babel/types"
import NodeUtils from "./utils.node.js";
import OtherUtils from "./../utils.js"
import path from "node:path";
import loger from "../../loger/index.js";
import { readFile } from "node:fs/promises";
import { MblerConfigData } from "../../types.js";
import { ParsedTagNode, PropNode } from "../types.js";
import McxUtlis from "./../utils.js";
import { randomUUID } from "node:crypto";
const McxConfig = {
  allowTag: {
    script: null,
    Event: null,
    Component: {
      items: {
        item: null
      }
    }
  }
}
const conBuild = require("./../../build/build-g-config.json")
export interface McxBuildCache {
  script ?: CompileData
  Component: {
    items: {
      Fileid: string
      UseExport: string
    }[],
    isLoad: boolean
  }
  Event: {
    on: "after" | "before"
    data: PropNode[]
  }
}
export const DefaultCache: BuildCache = {
  import: [],
  export: [],
  call: []
}
export class CompileData {
  public Cache: BuildCache
  public context: Context;
  public filePath: string = "";
  constructor(public AST: Program, cache: BuildCache = DefaultCache) {
    this.Cache = cache;
    this.context = new Context()
  }
}

export class McxCompileData {
  JSContext = new Context();
  public filePath: string = ""
  setFilePath(filePath: string) {
    this.filePath = filePath;
  }
  constructor(public AST: McxBuildCache) {}
}

class Utils {
  public static async FileAST(fileDir: string, parserOpt: ParserOptions): Promise < Program > {
    if (typeof fileDir !== "string") throw new TypeError("[read file]: compile utils was passed a non-string value");
    const file = await OtherUtils.readFile(fileDir)
    if (typeof file !== "string") throw new Error("[read file]: not found file " + fileDir)
    try {
      return Parser.parse(file).program
    } catch (err: any) {
      throw new Error("[compile ast]: " + err.stack)
    }
  }
  public static async FileContent(fileDir: string): Promise < string > {
    const file = await OtherUtils.readFile(fileDir);
    if (typeof file === "string") return file
    throw new Error("[read file]: not found file " + fileDir)
  }
  private static nodeStringValue(node: Identifier | StringLiteral): string {
    if (node.type == "StringLiteral") {
      return node.value
    } else if (node.type == "Identifier") {
      return node.name
    }
    throw new TypeError("[read id error]: no way to read string id")
  }
  private static CheckImportNode(node: ImportDeclaration, ir: ImportList): boolean {
    const newList = Utils.ImportToCache(node);
    // Eliminate common differences
    if (newList.source !== ir.source) return false;
    if (newList.imported.length !== ir.imported.length) return false;
    // in this for, newList.imported and ir.imported is same length
    for (let irIndex = 0; irIndex < newList.imported.length; irIndex++) {
      const newItem = newList.imported[irIndex];
      const oldItem = ir.imported[irIndex];
      if (newItem?.import !== oldItem?.import || newItem?.as !== oldItem?.as || newItem?.isAll !== oldItem?.isAll) return false;
    }
    return true;
  }
  public static CacheToImportNode(ir: ImportList): ImportDeclaration {
    if (!ir) throw new TypeError("plase call use right ImportList")
    // first verify ir.raw
    if (ir?.raw && Utils.CheckImportNode(ir?.raw, ir)) return ir.raw;
    let result: Array<t.ImportNamespaceSpecifier | t.ImportSpecifier | t.ImportDefaultSpecifier> = [];
    for (let ImportIt of ir.imported) {
      if (!ImportIt) continue
      if (ImportIt.isAll) {
        result.push(t.importNamespaceSpecifier(
          t.identifier(
            ImportIt.as
          )
        ))
        continue;
      }
      if (ImportIt.import == "default") {
        result.push(t.importDefaultSpecifier(
          t.identifier(ImportIt.as)
        ))
        continue
      }
      if (!ImportIt.import) throw new TypeError("[compile node]: not found imported")
      result.push(t.importSpecifier(
        t.identifier(ImportIt.as),
        t.identifier(ImportIt.import)
      ))
    }
    return t.importDeclaration(
      result,
      t.stringLiteral(ir.source)
    )
  }
  public static ImportToCache(node: ImportDeclaration): ImportList {
    const result: ImportListImport[] = []
    for (let item of node.specifiers) {
      const thisName = item.local.name
      if (item.type == "ImportNamespaceSpecifier") {
        result.push({
          isAll: true,
          as: thisName
        })
      } else if (item.type == "ImportDefaultSpecifier") {
        result.push({
          isAll: false,
          import: "default",
          as: thisName
        })
      } else if (item.type == "ImportSpecifier") {
        result.push({
          isAll: false,
          as: thisName,
          import: Utils.nodeStringValue(item.imported)
        })
      }
    }
    return {
      source: Utils.nodeStringValue(node.source),
      imported: result,
      raw: node
    }
  }
  
}
class CompileMain {
  public main: string;
  public babelConfig: ParserOptions;
  constructor(public compileOpt: CompileOpt) {
    this.main = OtherUtils.AbsoluteJoin(this.compileOpt.ProjectDir, this.compileOpt.main);
    let babelConfig = this.compileOpt.config?.babelParser
    if (!babelConfig) babelConfig = {};
    this.babelConfig = {
      sourceType: "module",
      allowImportExportEverywhere: false,
      createParenthesizedExpressions: false,
      attachComment: false,
      ...babelConfig
    }
  }
  async compile(): Promise < void > {
    if (!await OtherUtils.FileExsit(this.main)) {
      throw new Error("[compile error]: cannot find ")
    }
    let moduleCache: Map<string, CompileData | McxCompileData> = new Map()
    const main__code = await Utils.FileAST(this.main, this.babelConfig);
    const mainCompileData: CompileData =  this.traverse(main__code, true)
    mainCompileData.filePath = this.main;
    // for in import
    const importIrs = mainCompileData.Cache.import;
    let newBody: t.Statement[] = main__code.body as any;
    if (importIrs.length > 0) {
      // go in fn
      this.trImport(importIrs, moduleCache, this.main)
    }
    if (mainCompileData.Cache.export.length > 0) {
      newBody.push(...this.MergeExport(mainCompileData.Cache, mainCompileData.Cache.export));
    }
  }
  RandomUniqueValue(): string {
    return "__mbler__" + randomUUID().replace("-", "")
  }
  ensureExpression(node: Node): t.Expression {
    if (node.type == "ClassDeclaration") return t.classExpression(
      node.id,
      node.superClass,
      node.body
    )
    if (node.type == "FunctionDeclaration") return t.functionExpression(
      node.id,
      node.params,
      node.body,
      node.generator,
      node.async
    )
    if (t.isExpression(node)) return node;
    throw new Error("[compile error]: cannot ensure")
  }
  MergeExport(ir: BuildCache, exp: Array<t.ExportAllDeclaration | t.ExportDeclaration | t.ExportDeclaration>): Array<t.VariableDeclaration | t.ReturnStatement> {
    let result = [];
    let resObj: t.ObjectExpression = t.objectExpression([]);
    for (const item of exp) {
      if (item.type == "ExportAllDeclaration") {
        // ExportAllDeclaration
        resObj.properties.push(t.spreadElement(
          t.callExpression(t.identifier("__import"), [
            t.identifier(item.source.value)
          ])
        ));
      }
      else if (item.type == "ExportDefaultDeclaration") {
        // ExportDefaultDclaration
        resObj.properties.push(t.objectProperty(
          t.identifier("default"),
          this.ensureExpression(item.declaration)
        ))
      } else {
        // ExportNamedDeclaration
      }
    }
    result.push(t.returnStatement(resObj));
    return result;
  }
  genaterateModuleFunction(body: t.BlockStatement): t.FunctionDeclaration {
    return t.functionDeclaration(t.identifier(this.RandomUniqueValue()), [
      t.identifier("__import")
    ], body, false, true);
  }
  async trImport(
    importList: ImportList[],
    cacheMap: Map<string, CompileData | McxCompileData>,
    filePath: string
  ) {
    for (const moduleData of importList) {
      const source = moduleData.source;
      // 判断源的类型
      const PasreDir = path.parse(source);
      // if root = /, we should warn user because compiling can leave the computer 
      if (PasreDir.root == "/") {
        loger.w("mcx compile", "you shouldn't use Absolute path")
        continue;
      }
      let modulePath = "";
      // Relative Path
      if (PasreDir.dir == "./") {
        modulePath = path.join(filePath, source)
      } else if (source == "mcx") {
        // visit 'mcx'
        //  mcx 提供的导出被计划为大多都是宏，不需要处理
        continue;
      } else {
        // find module
        if (this.compileOpt.moduleList.includes(source)) {
          // is module
          const moduleDir = path.join(this.compileOpt.moduleDir, source)
          let moduleMainfest: MblerConfigData;
          try {
            moduleMainfest = JSON.parse(await readFile(path.join(moduleDir, conBuild.packageFile), "utf-8"));
          } catch {
            moduleMainfest = {
              name: "",
              mcVersion: "1.21.00",
              description: "",
              version: "0.0.1",
              script: {
                main: "./index.js"
              }
            }
          }
          const TempStr = moduleMainfest.script?.main
          if (typeof TempStr == "string") {
            modulePath = TempStr;
          }
          modulePath = path.join(moduleDir, modulePath)
        }
      }
      let compileData: CompileData | McxCompileData;
      const moduleCode = await readFile(modulePath, "utf-8");
      const moduleExt = path.extname(modulePath).slice(1);
      if (moduleExt == "js") {
        const AST: Program = Parser.parse(moduleCode).program;
        compileData = this.traverse(AST, true)
      } else if (moduleExt == "mcx") {
        compileData = this.MCXCompile(moduleCode)
      } else {
        throw new Error("[load module] load module '" + modulePath + "' : ext is not useful")
      }
      compileData.filePath = modulePath;
      cacheMap.set(modulePath, compileData)
    }
  }
  Tag(code: string): ParsedTagNode[] {
    return (new McxAST.tag(code)).parseAST()
  }
  MCXCompile(code: string): McxCompileData {
    const parser = this.Tag(code);
    let result: McxBuildCache = {
      Component: {
        items: [],
        isLoad: false
      },
      Event: {
        on: "after",
        data: []
      }
    }
    let isTop: boolean = true;
    let allowTag: any = McxConfig.allowTag;
    const FindTag = (node: ParsedTagNode[], lastTag: string[]): void => {
      const allowTagNames = Object.keys(allowTag);
      for (let index = 0; index < node.length; index++) {
        const item = node[index];
        const hasContext: boolean = !!(typeof item?.content?.data == "string" && item.content.data.trim())
        if (typeof item?.name !== "string") throw new Error("[compile error]: mcx: Tag name is not string")
        if (!allowTagNames.includes(item?.name)) throw new Error("[compile error]: mcx: visit not allow tag: " + item?.name);
        if (isTop) {
          if (item.name == "script") {
            // 验证内容
            if (!hasContext || !item.content) throw new Error("[compile error]: mcx: script tag shouldn't null")
            // 验证是否已写
            if (result.script) throw new Error("[compile error]: mcx: a mcx cannot have two script tag")
            result.script = this.traverse(
              Parser.parse(item.content.data).program,
              true
            )
            continue;
          }
          if (item.name == "Event") {
            // 验证内容
            if (!hasContext || !item.content) throw new Error("[compile error]: mcx: Event shouldn't null")
            // 验证属性是否可写
            if (result.Event.data.length > 0) throw new Error("[compile error]: mcx: a mcx can't have two event tag")
            // 验证是否冲突
            if (result.Component.isLoad) throw new Error("[compile error]: mcx: a mcx can't have comonent and event")
            const prop = McxAST.prop(item.content.data);
            if (prop.length < 1) throw new Error("[compile error]: mcx: event tag should't have null data");
            const TempObj = item.arr;
            let on: "after" | "before";
            // 判断事件类型
            const isAfter = Boolean(TempObj["@after"])
            const isBefore = Boolean(TempObj["@before"])
            if (isAfter && isBefore) throw new Error("[compile error]: mcx: Event can't have @after and @before")
            on = isAfter ? "after" : (isBefore ? "before" : "after")
            result.Event = {
              on,
              data: prop
            }
          }
          if (item.name == "Component") {
            if (!hasContext || !item.content) throw new Error("[compile error]: mcx: Component should't null");
            // 是否冲突
            if (result.Event.data.length > 0) throw new Error("[compile error]: mcx: compoent tag can't use with event tag")
            // 是否已写
            if (result.Component.isLoad) throw new Error("[compile error]: mcx: a mcx shouldn't use more component")
            
            FindTag(this.Tag(item.content.data), [item.name])
          }
        }
        const TopTag = lastTag[0]
        // 不需要判断 script和Event，因为其只有一层
        if (TopTag == "Component") {} else {
          throw new Error("[compile mcx]: TopTag is not right")
        }
      }
    }
    FindTag(parser, [])
    const res = new McxCompileData(result)
    return res;
  }
  traverse(node: t.Block, isTop: boolean, data ?: CompileData): CompileData {
    if (isTop && node.type == "Program") data = new CompileData(node)
    if (!data) throw new Error("[traverse error]: cannot init CompileData")
    const buildCache = data.Cache;
    for (let nodeIndex: number = 0; nodeIndex < node.body.length; nodeIndex++) {
      const nodeItem = node.body[nodeIndex];
      if (!nodeItem) continue;
      // must in global
      if (isTop) {
        switch (nodeItem.type) {
          case "ImportDeclaration":
            const newsImport = Utils.ImportToCache(nodeItem);
            buildCache.import.push(newsImport)
            node.body.splice(nodeIndex, 1);
            nodeIndex -= 1
            break
          case "ExportDefaultDeclaration":
          case "ExportAllDeclaration":
          case "ExportNamedDeclaration":
            buildCache.export.push(nodeItem)
            node.body.splice(nodeIndex, 1)
            nodeIndex -= 1
            break;
        }
      }
      // 都有的
      switch (nodeItem.type) {
        case "ExpressionStatement":
          const Exp = nodeItem.expression
          if (Exp.type == "CallExpression") {
            const callee = Exp.callee;
            let name: string[] = [];
            if (callee.type == "Identifier") name.push(callee.name)
            if (callee.type == "MemberExpression") name = NodeUtils.memberExpressionToStringArray(callee, 3)
            if (name.length >= 1) buildCache.call.push({
              arguments: Exp.arguments,
              remove: (): void => {
                node.body.splice(nodeIndex, 1)
              },
              source: name
            })
          }
          break;
        case "IfStatement":
          // handler node
          if (nodeItem.consequent) this.traverse(t.blockStatement(
            [nodeItem.consequent]
          ), false, data);
          if (nodeItem.alternate) this.traverse(t.blockStatement([
            nodeItem.alternate
          ]), false, data)
          break;
      }
    }
    return data;
  }
}
export default CompileMain;