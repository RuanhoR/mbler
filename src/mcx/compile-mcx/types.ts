import type {
  ParserOptions
} from "@babel/parser";
import type {
  Node,
  ImportDeclaration
} from "@babel/types"
interface callList {
  source: string[]
  arguments: Node[]
  remove: Function
}
interface ImportListImport {
  isAll: boolean
  import ? : string
  as: string
}
interface ImportList {
  source: string
  imported: ImportListImport[]
  raw ? : ImportDeclaration
}
interface BuildCache {
  call: callList[]
  import: ImportList[]
  export: [Node,Node][]
}
type MCX_INFO = {
  author: "github@RuanhoR"
  buildSystem: string
  buildSystemVersion: string
  // time
  buildTime: number
}
export type {
  BuildCache,
  MCX_INFO,
  ImportList,
  ImportListImport,
  CompileOpt
}
interface CompileUserConfig {
  babelParser ?: ParserOptions
  allowJS ?: boolean
  useTS ?: boolean
}
interface CompileOpt {
  cacheDir: string
  main: string
  ProjectDir: string
  moduleDir: string
  output: string
  isCache: boolean
  config: Partial<CompileUserConfig>
}