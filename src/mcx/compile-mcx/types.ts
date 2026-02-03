import type {
  ParserOptions
} from "@babel/parser";
import type {
  ImportDeclaration,
  ExportAllDeclaration,
  ExportDefaultDeclaration,
  ExportNamedDeclaration,
  Expression,
  SpreadElement,
  ArgumentPlaceholder
} from "@babel/types"
interface callList {
  source: Expression
  arguments: Array<SpreadElement | Expression | ArgumentPlaceholder>
  remove: () => void
}
interface ImportListImport {
  isAll: boolean
  import ? : string | undefined
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
  export: Array<ExportNamedDeclaration | ExportAllDeclaration | ExportDefaultDeclaration>
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
  useTS ?: boolean
}
interface CompileOpt {
  cacheDir: string
  main: string
  ProjectDir: string
  moduleDir: string
  moduleList: string[]
  output: string
  isCache: boolean
  config: Partial<CompileUserConfig>
}