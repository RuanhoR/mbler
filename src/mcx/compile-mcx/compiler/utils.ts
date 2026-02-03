import { readFile } from "node:fs/promises";
import Parser, { ParserOptions } from "@babel/parser"
import { ImportList, ImportListImport } from "../types";
import * as t from "@babel/types"
export default class Utils {
  public static async FileAST(fileDir: string, parserOpt: ParserOptions): Promise < t.Program > {
    if (typeof fileDir !== "string") throw new TypeError("[read file]: compile utils was passed a non-string value");
    const file = await readFile(fileDir, "utf-8")
    if (typeof file !== "string") throw new Error("[read file]: not found file " + fileDir)
    try {
      return Parser.parse(file).program
    } catch (err: any) {
      throw new Error("[compile ast]: " + err.stack)
    }
  }
  public static async FileContent(fileDir: string): Promise < string > {
    const file = await readFile(fileDir, "utf-8")
    return file
  }
  private static nodeStringValue(node: t.Identifier | t.StringLiteral): string {
    if (node.type == "StringLiteral") {
      return node.value
    } else if (node.type == "Identifier") {
      return node.name
    }
    throw new TypeError("[read id error]: no way to read string id")
  }
  private static CheckImportNode(node: t.ImportDeclaration, ir: ImportList): boolean {
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
  public static CacheToImportNode(ir: ImportList): t.ImportDeclaration {
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
  public static ImportToCache(node: t.ImportDeclaration): ImportList {
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
      imported: result
    }
  }
}