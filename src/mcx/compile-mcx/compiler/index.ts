import * as t from "@babel/types"
import { ImportList } from "../types";
import Utils from "./utils";
import { parse } from "@babel/parser";
class CompileJS {
  constructor(public node: t.Program) {
    if (!t.isProgram(node)) throw new Error("[compile error]: jsCompile can't work in a not program")
    this.run();
  }
  run() {
    /**
     * @description 临时导入缓存 用于删除没有用到的模块导入 （树摇）
     */
    const tempImp: ImportList[] = [];
    const tre = (node: t.Block) => {
      if (!t.isBlock(node)) throw new Error()
      const isTop: boolean = t.isProgram(node);
      for (let item of node.body) {
        if (item.type == "ImportDeclaration") {
          if (!isTop) throw new Error("[compile node]: import declaration must use in top.");
          tempImp.push(Utils.ImportToCache(item))
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
          if (item.superClass) {}
        }
      }
    }
  }
}

export function compileJS(code: string): CompileJS {
  return new CompileJS(parse(code).program);
}