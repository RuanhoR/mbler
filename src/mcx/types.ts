type ParseReadFileOpt = {
  delay: number;
  maxRetries: number;
  want: 'string' | 'object';
};
type ReadFileOpt = Partial<ParseReadFileOpt>
interface BaseToken {
  data: string;
  type: TokenType;
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
type AttributeMap = Record < string, string | boolean > ;
interface ParsedTagNode {
  start: TagToken;
  name: string;
  arr: AttributeMap;
  content: ParsedTagContentNode | null;
  end: TagEndToken | null;
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
type JsType = "number" | "string" | "object" | "function" | "bigint" | "symbol"
interface TypeVerifyBody {
  [key: string]: JsType
}
export type {
  ParseReadFileOpt,
  ReadFileOpt,
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
  ParsedTagNode
}