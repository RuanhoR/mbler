import AST from "./ast/index.js";
import compiler from "./compile-mcx/index.js";
import utils from "./utils.js"
export default {
  load: compiler,
  AST: AST,
  utils: utils,
}
