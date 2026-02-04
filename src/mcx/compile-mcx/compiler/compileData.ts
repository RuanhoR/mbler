import * as t from "@babel/types"
import { BuildCache, MCXstructureLoc } from "../types";
import { ParsedTagNode } from "../../types";
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
  constructor(public raw: ParsedTagNode[], public JSIR: JsCompileData, public strLoc: MCXstructureLoc) {}
  setFilePath(dir: string) {
    this.JSIR.setFilePath(dir);
    this.isFile = true;
    this.File = dir;
  }
}