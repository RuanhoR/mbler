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
  type ParserOptions
} from "@babel/parser"
import Parser from "@babel/parser"
import * as t from "@babel/types"
import {
  type ImportDeclaration,
  type Node,
  type Program,
  type Identifier,
  type StringLiteral
} from "@babel/types"
import fs from "node:fs/promises"
import OtherUtils from "./../utils.js"
class CompileData {
  public Cache: BuildCache
  public context: Context;
  constructor(public mainAST: Program, cache: BuildCache = {
    call: [],
    import: [],
    export: []
  }) {
    this.Cache = cache;
    this.context = new Context()
  }
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
    const main__code = await Utils.FileAST(this.main, this.babelConfig);
    await this.traverse(main__code)
  }
  // TODO 
  async traverse(node: Program): Promise<CompileData> {
    const context = new CompileData(node)
    const buildCache = context.Cache
    for (let nodeIndex in node.body) {
      const nodeItem = node.body[nodeIndex];
      if (!nodeItem) continue;
      switch (nodeItem.type) {
        case "ImportDeclaration":
          const newsImport = Utils.ImportToCache(nodeItem);
          // push cachs;
          buildCache.import.push(newsImport)
          break;
          // ExportNamedDeclaration must in top
        case "ExportNamedDeclaration":
          break;
        case "Export"
      }
    }
  }
}
export default CompileMain;