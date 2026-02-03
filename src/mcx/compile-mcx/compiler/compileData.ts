import * as t from "@babel/types"
import { BuildCache } from "../types";
import { Node } from "posthtml-parser";
export class JsCompileData {
  File: string = "__repl";
  isFile: boolean = false;
  constructor(public node: t.Program, public BuildCache: BuildCache = {
    export: [],
    import: [],
    call: []
  }) {}
  setFilePath(dir: string) {
    this.isFile = true;
    this.File = dir;
  }
}
export class MCXCompileData {
  File: string = "";
  isFile: boolean = false;
  constructor(public raw: Node[], public JSIR: JsCompileData) {}
  setFilePath(dir: string) {
    this.JSIR.setFilePath(dir);
    this.isFile = true;
    this.File = dir;
  }
}