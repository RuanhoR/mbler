import * as t from "@babel/types";
import { ImportList, ImportListImport } from "../types";
import * as CompileData from "./compileData";
import Utils from "./utils";
import { parse } from "@babel/parser";
interface ImportTemp extends ImportListImport {
  source: string;
  as: never;
}
export type Context = Record<string, t.Expression | { status: "wait" }>;
type MemberItem =
  | t.NewExpression
  | t.CallExpression
  | t.Super
  | t.ThisExpression
  | t.Import
  | t.Literal
  | t.Identifier;
export class CompileJS {
  constructor(public node: t.Program) {
    if (!t.isProgram(node))
      throw new Error("[compile error]: jsCompile can't work in a not program");
    this.CompileData = new CompileData.JsCompileData(node);
    this.run();
    this.writeBuildCache();
  }
  TopContext: Context = {};
  indexTemp: Record<string, ImportTemp> = {};
  push = (source: ImportList) => {
    for (const node of source.imported) {
      this.indexTemp[node.as] = {
        source: source.source,
        import: node.import,
        isAll: node.isAll,
      } as any;
    }
  };
  takeInnerMost(node: t.MemberExpression): MemberItem {
    if (!t.isMemberExpression(node))
      throw new Error("[take item}: must MemberExpression");
    let current: t.Node | t.Expression | t.V8IntrinsicIdentifier = node;
    while (true) {
      if (t.isMemberExpression(current)) {
        current = current.object;
        continue;
      }

      if (t.isCallExpression(current)) {
        const callee = current.callee as t.Node;
        if (t.isMemberExpression(callee)) {
          current = callee.object;
          continue;
        }
        current = callee;
        continue;
      }

      if (
        t.isIdentifier(current) ||
        t.isThisExpression(current) ||
        t.isSuper(current) ||
        t.isImport(current) ||
        t.isNewExpression(current) ||
        (typeof t.isLiteral === "function" && (t.isLiteral as any)(current))
      ) {
        return current as MemberItem;
      }

      if (t.isLiteral(current)) {
        return current as MemberItem;
      }

      return t.stringLiteral("");
    }
  }
  writeImportKeys: string[] = [];
  extractIdentifierNames(node: t.Expression | t.V8IntrinsicIdentifier | t.PrivateName): string[] {
    const identifiers: string[] = [];

    if (t.isIdentifier(node)) {
      identifiers.push(node.name);
    } else if (t.isMemberExpression(node)) {
      identifiers.push(...this.extractIdentifierNames(node.object));
      if (node.property.type !== "PrivateName") {
        identifiers.push(...this.extractIdentifierNames(node.property));
      }
    } else if (t.isCallExpression(node)) {
      identifiers.push(...this.extractIdentifierNames(node.callee));
      for (const arg of node.arguments) {
        if (t.isExpression(arg)) {
          identifiers.push(...this.extractIdentifierNames(arg));
        }
      }
    } else if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
      identifiers.push(...this.extractIdentifierNames(node.left));
      identifiers.push(...this.extractIdentifierNames(node.right));
    } else if (t.isUnaryExpression(node)) {
      identifiers.push(...this.extractIdentifierNames(node.argument));
    } else if (t.isConditionalExpression(node)) {
      identifiers.push(...this.extractIdentifierNames(node.test));
      identifiers.push(...this.extractIdentifierNames(node.consequent));
      identifiers.push(...this.extractIdentifierNames(node.alternate));
    }

    return identifiers;
  }
  writeBuildCache() {
    const currenySource: string[] = [];
    let build: ImportList[] = [];
    for (const [as, data] of Object.entries(this.indexTemp)) {
      // only include imports that were actually referenced
      if (!this.writeImportKeys.includes(as)) continue;

      if (currenySource.includes(data.source)) {
        let isFound: boolean = false;
        for (const index in build) {
          const i = build[index];
          if (!i) continue;
          if (i.source == data.source) {
            i.imported.push({
              as: as,
              isAll: data.isAll,
              import: data.import,
            });
            isFound = true;
          }
        }
        if (!isFound)
          throw new Error("[mcx compoiler]: internal error: unexpected source");
      } else {
        build.push({
          source: data.source,
          imported: [
            {
              as,
              import: data.import,
              isAll: data.isAll,
            },
          ],
        });
        currenySource.push(data.source);
      }
    }
    // write filtered imports into CompileData.BuildCache
    this.CompileData.BuildCache.import = build;
  }
  CompileData: CompileData.JsCompileData;
  conditionalInTempImport(
    node: t.Expression,
    thisContext: Context,
    remove: () => void,
  ): void {
    // If identifier, mark it
    if (t.isIdentifier(node)) {
      if (node.name in this.indexTemp && !this.writeImportKeys.includes(node.name)) {
        this.writeImportKeys.push(node.name);
      }
      return;
    }

    if (node.type == "FunctionExpression") {
      this.tre(t.blockStatement([node.body]));
      return;
    }

    if (node.type == "ArrowFunctionExpression") {
      if (t.isExpression(node.body)) {
        this.conditionalInTempImport(node.body, thisContext, remove);
      } else {
        this.tre(node.body);
      }
      return;
    }

    if (t.isLiteral(node)) return;

    // If member expression, collect identifiers inside it
    if (t.isMemberExpression(node)) {
      const names = this.extractIdentifierNames(node);
      for (const n of names) {
        if (n in this.indexTemp && !this.writeImportKeys.includes(n)) this.writeImportKeys.push(n);
      }
      // recurse into object and property when applicable
      this.conditionalInTempImport(node.object as t.Expression, thisContext, remove);
      if (t.isExpression(node.property)) this.conditionalInTempImport(node.property, thisContext, remove);
      return;
    }

    // Call expression: record call for buildcache and mark identifiers used in callee and args
    if (t.isCallExpression(node) && node.callee?.type !== "V8IntrinsicIdentifier") {
      // mark identifiers inside callee (including member expressions)
      const names = this.extractIdentifierNames(node.callee as any);
      for (const n of names) {
        if (n in this.indexTemp && !this.writeImportKeys.includes(n)) this.writeImportKeys.push(n);
      }

      this.CompileData.BuildCache.call.push({
        source: node.callee,
        arguments: node.arguments,
        remove,
      });

      this.conditionalInTempImport(node.callee as t.Expression, thisContext, remove);
      for (const arg of node.arguments) {
        if (t.isExpression(arg)) this.conditionalInTempImport(arg, thisContext, remove);
      }
      return;
    }

    // Generic expressions: try to extract identifier names and mark them
    try {
      const names = this.extractIdentifierNames(node as any);
      for (const n of names) {
        if (n in this.indexTemp && !this.writeImportKeys.includes(n)) this.writeImportKeys.push(n);
      }
    } catch (_) {
      // ignore
    }
  }
  log: any[] = [];
  tre(node: t.Block, ExtendContext: Context = {}): void {
    if (!t.isBlock(node))
      throw new Error("[compile error]: can't for in not block node");
    const isTop: boolean = t.isProgram(node);
    const currenyContext: Context = isTop ? this.TopContext : ExtendContext;
    for (let index in node.body) {
      this.log.push(index);
      const item = node.body[index];
      const remove = () => {
        node.body.splice(parseInt(index), 1);
      };
      if (!item) continue;
      if (item.type == "ImportDeclaration") {
        if (!isTop)
          throw new Error(
            "[compile node]: import declaration must use in top.",
          );
        this.push(Utils.ImportToCache(item));
        remove()
      } else if (item.type == "BlockStatement") {
        this.tre(item, currenyContext);
      } else if (
        item.type == "BreakStatement" ||
        item.type == "EmptyStatement" ||
        item.type == "ContinueStatement" ||
        item.type == "ThrowStatement" ||
        item.type == "WithStatement"
      ) {
        continue;
      } else if (item.type == "TryStatement") {
        this.tre(item.block, currenyContext);
      } else if (item.type == "IfStatement") {
        const If = item.test;
        this.conditionalInTempImport(If, currenyContext, remove);
        const nodes: t.Statement[] = [item.consequent];
        if (item.alternate) nodes.push(item.alternate);
        // if ... else ... make one by one
        this.tre(t.blockStatement(nodes), currenyContext);
      } else if (item.type == "WhileStatement") {
        this.tre(t.blockStatement([item.body]), currenyContext);
      } else if (item.type == "ClassDeclaration") {
        if (item.superClass) {
          const superClass = item.superClass;
          let superId: string | null = null;
          if (superClass.type == "Identifier") {
            superId = superClass.name;
          }
          if (superClass.type == "MemberExpression") {
            // take the innermost item
            const tempNode = this.takeInnerMost(superClass);
            if (tempNode.type == "Identifier") {
              superId = tempNode.name;
            }
          }
          // Prevent values that are not allowed to be extends
          if (
            superClass.type == "ArrayExpression" ||
            superClass.type == "BooleanLiteral" ||
            superClass.type == "BinaryExpression" ||
            superClass.type == "ThisExpression" ||
            superClass.type == "ArrowFunctionExpression" ||
            superClass.type == "BigIntLiteral" ||
            superClass.type == "NumericLiteral" ||
            superClass.type == "NullLiteral" ||
            superClass.type == "AssignmentExpression" ||
            superClass.type == "Super" ||
            superClass.type == "NewExpression" ||
            superClass.type == "DoExpression" ||
            superClass.type == "StringLiteral" ||
            superClass.type == "YieldExpression" ||
            superClass.type == "RecordExpression" ||
            superClass.type == "RegExpLiteral" ||
            superClass.type == "DecimalLiteral" ||
            superClass.type == "BindExpression"
          )
            throw new Error(
              "[compilr error]: class can't extends a not constructor or null",
            );
          if (superId) {
            if (this.indexTemp[superId]) {
              this.writeImportKeys.push(superId);
            }
          }
        }
      } else if (item.type == "DoWhileStatement") {
        this.tre(t.blockStatement([item.body]));
        this.conditionalInTempImport(item.test, currenyContext, remove);
      } else if (item.type == "VariableDeclaration") {
        const declaration = item.declarations;
        for (const varDef of declaration) {
          const init = varDef.init;
          const id = varDef.id;
          if (id.type == "Identifier") {
            if (!init && (item.kind == "let" || item.kind == "var"))
              currenyContext[id.name] = {
                status: "wait",
              };
            if (!init)
              throw new Error("[compilr node]: 'const' must has a init");
            currenyContext[id.name] = init;
          }
        }
      } else if (item.type == "ReturnStatement") {
        const body = item.argument;
        if (!body) continue;
        this.conditionalInTempImport(body, currenyContext, remove);
      } else if (
        item.type == "ExportAllDeclaration" ||
        item.type == "ExportDefaultDeclaration" ||
        item.type == "ExportNamedDeclaration"
      ) {
        if (!isTop) {
          throw new Error("[compiler]: export node can't in not top");
        }
        this.CompileData.BuildCache.export.push(item);
        remove();
      } else if (item.type == "SwitchStatement") {
        const vaule = item.discriminant;
        this.conditionalInTempImport(vaule, currenyContext, remove);
        for (const caseItem of item.cases) {
          if (caseItem.test) {
            this.conditionalInTempImport(caseItem.test, currenyContext, remove);
          }
          this.tre(t.blockStatement(caseItem.consequent), currenyContext);
        }
      } else if (item.type == "ExpressionStatement") {
        this.conditionalInTempImport(item.expression, currenyContext, remove);
      }
      else if (item.type == "FunctionDeclaration") {
        const funcBody = item.body;
        this.tre(funcBody, currenyContext);
      }
    }
  }
  run() {
    if (!t.isBlock(this.node))
      throw new Error("[compile error]: can't for a not block");
    this.tre(this.node);
  }
}

export function compileJSFn(code: string): CompileData.JsCompileData {
  const comiler = new CompileJS(parse(code).program);
  comiler.run();
  return comiler.CompileData;
}
