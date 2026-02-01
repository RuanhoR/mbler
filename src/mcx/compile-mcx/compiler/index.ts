import * as t from "@babel/types"
import { ImportList, ImportListImport } from "../types";
import Utils from "./utils";
import { parse } from "@babel/parser";
interface ImportTemp extends ImportListImport {
  source: string
  as : never
}
class CompileJS {
  constructor(public node: t.Program) {
    if (!t.isProgram(node)) throw new Error("[compile error]: jsCompile can't work in a not program")
    this.run();
  }
  run() {
    const indexTemp: Record<string, ImportTemp> = {}
    /**
     * @description 临时导入缓存 用于删除没有用到的模块导入 （树摇）
     */
    const push = (source: ImportList) => {
      for (const node of source.imported) {
        indexTemp[node.as] = {
          source: source.source,
          import: node.import,
          isAll: node.isAll
        } as any
      }
    }
    const FindVarInImport = (id: string): boolean => tempImp.some(
      ())
    const tre = (node: t.Block) => {
      if (!t.isBlock(node)) throw new Error("[compile error]: can't for in not block node")
      const isTop: boolean = t.isProgram(node);
      for (let item of node.body) {
        if (item.type == "ImportDeclaration") {
          if (!isTop) throw new Error("[compile node]: import declaration must use in top.");
          push(Utils.ImportToCache(item))
        }
        else if (item.type == "BlockStatement") {
          tre(item)
        }
        else if (item.type == "BreakStatement" || item.type == "EmptyStatement" || item.type == "ContinueStatement" || item.type == "ThrowStatement" || item.type == "WithStatement") {
          continue;
        }
        else if (item.type == "TryStatement") {
          tre(t.blockStatement(item.block.body));
        }
        else if (item.type == "IfStatement") {
          const nodes: t.Statement[] = [item.consequent];
          if (item.alternate) nodes.push(item.alternate);
          // if ... else ... make one by one
          tre(t.blockStatement(nodes));
        }
        else if (item.type == "WhileStatement") {
          tre(t.blockStatement([item.body]))
        }
        else if (item.type == "ClassDeclaration") {
          if (item.superClass) {
            const superClass = item.superClass;
            let superId: string = "";
            if (superClass.type == "Identifier") {
              superId = superClass.name;
            }
            if (superClass.type == "ArrayExpression" || superClass.type == "BooleanLiteral" || superClass.type == "BinaryExpression" || superClass.type == "ThisExpression") throw new Error()
            if (superId) FindVarInImport(superId)
            }
          }
        }
      }
    }
  }
}

export function compileJS(code: string): CompileJS {
  return new CompileJS(parse(code).program);
}