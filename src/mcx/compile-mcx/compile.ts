
import type {
  CompileOpt
} from "./types.js"
import Utils from "./../utils.js"
/*import _compile from "./_compile.js"*/
/**
 * @description - this is a function factory to generate mcxProject
 */
export default function CompileMcxProject(BuildOpt: CompileOpt): Promise<void> {
  return (new Compile(BuildOpt)).start()
}
class Compile {
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
    /*await (new _compile(this.BuildOpt)).compile();*/
  }
}