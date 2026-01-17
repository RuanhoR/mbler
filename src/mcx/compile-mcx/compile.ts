import Parser from "@babel/parser"
import type {
  BuildCache,
  CompileOpt
} from "./types.js"
import Context from "./context.js"
import type {
  Program,
  Node
} from "@babel/types"
import Utils from "./../utils.js"
import _compile from "./_compile.js"
/**
 * @description - this is a function factory to generate mcxProject
 */
export default function CompileMcxProject(BuildOpt: CompileOpt): Promise<void> {
  return (new Compile(BuildOpt)).start()
}
class Compile {
  private buildCache: BuildCache = {};
  constructor(public BuildOpt: CompileOpt) {
    // 类型验证
    if (!Utils.TypeVerify(this.BuildOpt, {
      cacheDir: "string",
      main: "string",
      moduleDir: "string",
      output: "string",
      isCache: "boolean"
    })) {
      throw new TypeError("[compile checker]Input Opt is not right")
    };
  }
  async start(): Promise<void> {
    await (new _compile(this.BuildOpt)).compile();
  }
}