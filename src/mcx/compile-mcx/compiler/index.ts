import * as t from "@babel/types";
import { ImportList, ImportListImport } from "../types";
import * as CompileData from "./compileData";
import Utils from "./utils";
import { parse } from "@babel/parser";
interface ImportTemp extends ImportListImport {
  source: string;
  as: never;
}
type Context = Record<string, t.Expression>;
type MemberItem = t.NewExpression | t.CallExpression | t.Super | t.ThisExpression | t.Import | t.Literal | t.Identifier
class CompileJS {
  constructor(public node: t.Program) {
    if (!t.isProgram(node))
      throw new Error("[compile error]: jsCompile can't work in a not program");
    this.run();
    this.CompileData = new CompileData.JsCompileData(node);
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
    if (!t.isMemberExpression(node)) throw new Error("[take item}: must MemberExpression");
    let tempNode: t.Expression | t.V8IntrinsicIdentifier = node.object;
    let end: MemberItem;
    while (true) {
      if (tempNode.type !== "MemberExpression") {
        if (
          t.isLiteral(tempNode) ||
          tempNode.type == "NewExpression" ||
          tempNode.type == "Super" ||
          tempNode.type == "Identifier" ||
          tempNode.type == "Import" ||
          tempNode.type == "ThisExpression"
        ) {
          end = tempNode;
          break;
        }
        else if (tempNode.type == "CallExpression") {
          // @ts-ignore
          const callee = tempNode.callee;
          if (callee.type == "MemberExpression") {
            tempNode = callee.object;
          }
          tempNode = callee;
        }
        else {
          return t.stringLiteral("");
        }
      } else {
        tempNode = tempNode.object
      } 
    }
    return end;
  };
  CompileData: CompileData.JsCompileData;
  conditionalInTempImport(node: t.Expression, thisContext: Context): void {
    if (node.type == "Identifier")
  };
  run(): void {
    const FindVarInImport = (id: string): void => {};
    const tre = (node: t.Block) => {
      if (!t.isBlock(node))
        throw new Error("[compile error]: can't for in not block node");
      const isTop: boolean = t.isProgram(node);
      const currenyContext = {}
      for (let item of node.body) {
        if (item.type == "ImportDeclaration") {
          if (!isTop) throw new Error(
              "[compile node]: import declaration must use in top.",
            );
          this.push(Utils.ImportToCache(item));
        } else if (item.type == "BlockStatement") {
          tre(item);
        } else if (
          item.type == "BreakStatement" ||
          item.type == "EmptyStatement" ||
          item.type == "ContinueStatement" ||
          item.type == "ThrowStatement" ||
          item.type == "WithStatement"
        ) {
          continue;
        } else if (item.type == "TryStatement") {
          tre(t.blockStatement(item.block.body));
        } else if (item.type == "IfStatement") {
          const If = item.test;
          this.conditionalInTempImport(If);
          const nodes: t.Statement[] = [item.consequent];
          if (item.alternate) nodes.push(item.alternate);
          // if ... else ... make one by one
          tre(t.blockStatement(nodes));
        } else if (item.type == "WhileStatement") {
          tre(t.blockStatement([item.body]));
        } else if (item.type == "ClassDeclaration") {
          if (item.superClass) {
            const superClass = item.superClass;
            let superId: string | null = null;
            if (superClass.type == "Identifier") {
              superId = superClass.name
            }
            if (superClass.type == "MemberExpression") {
              // take the innermost item
              const tempNode = this.takeInnerMost(superClass)
              if (tempNode.type == "Identifier") {
                superId = tempNode.name;
              }
            };
            // Prevent values that are not allowed to be extends
            if (
              superClass.type == "ArrayExpression" || superClass.type == "BooleanLiteral" || superClass.type == "BinaryExpression" || superClass.type == "ThisExpression" || superClass.type == "ArrowFunctionExpression" || superClass.type == "BigIntLiteral" ||
              superClass.type == "NumericLiteral" || superClass.type == "NullLiteral" || superClass.type == "AssignmentExpression" || superClass.type == "Super" || superClass.type == "NewExpression" || superClass.type == "DoExpression" || superClass.type == "StringLiteral" ||
              superClass.type == "YieldExpression" || superClass.type == "RecordExpression" || superClass.type == "RegExpLiteral" || superClass.type == "DecimalLiteral" || superClass.type == "BindExpression"
            ) throw new Error("[compilr error]: class can't extends a not constructor or null");
            if (superId) {
              FindVarInImport(superId);
            }
          }
        }
        else if (item.type == "DoWhileStatement") {
          tre(t.blockStatement([item.body]));
          this.conditionalInTempImport(item.test)
        }
      }
    };
    tre(this.node)
  }
}

export function compileJS(code: string): CompileData.JsCompileData {
  const comiler = new CompileJS(parse(code).program);
  comiler.run();
  return comiler.CompileData;
}
