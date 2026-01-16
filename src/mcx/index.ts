import AST from "./ast/index.js";
import compiler from "./compile-mcx/index.js";
import utils from "./utils.js";
import errors from "./errors.js"
export default {
  load: compiler,
  AST: AST,
  utils: utils,
  errorList: errors
}
Object.setPrototypeOf(module.exports, null);