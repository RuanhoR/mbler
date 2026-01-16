import os from "node:os"
import type {
  MCX_INFO
} from "./types.js"
import type {
  McxOpt,
} from "../types.js"
const versions = os.userInfo();
const buildSystem: string = os.type();
const buildSystemVersion: string = os.version();
export default class Context {
  __MCX__: MCX_INFO = {
    author: "github@RuanhoR",
    buildSystem,
    buildSystemVersion,
    buildTime: Date.now()
  };
}
interface contextType {
  BuildCache: BuildCache
  __MCX__: MCX_INFO
}
export type {
  contextType
}
export const InfoCompile: string[] = ["__MCX__"]