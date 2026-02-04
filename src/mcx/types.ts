interface BaseToken {
  data: string;
  type: TokenType;
  startIndex ?: number;
  endIndex ?: number;
  startLine ?: number;
  loc ?: MCXLoc;
}
interface TagToken extends BaseToken {
  type: 'Tag';
}
interface TagEndToken extends BaseToken {
  type: 'TagEnd';
}
interface ContentToken extends BaseToken {
  type: 'Content';
}
type Token = TagToken | TagEndToken | ContentToken;
type AttributeMap = Record<string, string | boolean>;
interface MCXLoc {
  start: { line: number; index: number };
  end: { line: number; index: number };
}
interface ParsedTagNode {
  start: TagToken;
  name: string;
  arr: AttributeMap;
  content: (ParsedTagContentNode | ParsedTagNode)[];
  end: TagEndToken | null;
  loc: MCXLoc;
}
interface ParsedTagContentNode {
  data: string;
  type: 'TagContent';
}
type TokenType = 'Tag' | 'TagEnd' | 'Content';
type PropValue = number | string | object
interface PropNode {
  key: string
  value: PropValue
  type: "PropChar" | "PropObject"
}
type JsType = "boolean" | "number" | "string" | "object" | "function" | "bigint" | "symbol"
interface TypeVerifyBody {
  [key: string]: JsType
}
export type {
  Token,
  ContentToken,
  TagEndToken,
  TagToken,
  BaseToken,
  AttributeMap,
  PropValue,
  TokenType,
  ParsedTagContentNode,
  TypeVerifyBody,
  JsType,
  PropNode,
  ParsedTagNode,
  MCXLoc
}