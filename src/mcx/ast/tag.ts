import type {
  BaseToken,
  TagToken,
  TagEndToken,
  ContentToken,
  Token,
  ParsedTagNode,
  AttributeMap,
  ParsedTagContentNode,
  TokenType
} from "./../types.js"
class Lexer {
  private text: string;
  private booleanProxyCache: WeakMap<object, any>;
  constructor(text: string) {
    this.text = text;
    this.booleanProxyCache = new WeakMap();
  }
  get tokens(): Iterable<ParsedTagNode> {
    return {
      [Symbol.iterator]: () => this.tokenIterator()
    };
  }
  /**
   * 解析标签属性，如：<div id="app" disabled />
   */
  parseAttributes(tagContent: string): {
    name: string; arr: AttributeMap
  } {
    const attributes: Record<string, string> = {};
    let currentKey = '';
    let currentValue = '';
    let inKey = true;
    let name = '';
    let inValue = false;
    let quoteChar: string | null = null;
    let isTagName = true;

    for (let i = 0; i < tagContent.length; i++) {
      const char = tagContent[i];

      if (isTagName) {
        if (char === ' ' || char === '>') {
          name = currentKey.trim();
          currentKey = '';
          isTagName = false;
          if (char === '>') break;
        } else {
          currentKey += char;
        }
        continue;
      }

      if (inValue) {
        if (
          char === quoteChar &&
          (currentValue.length === 0 || currentValue[currentValue.length - 1] !== '\\')
        ) {
          attributes[currentKey.trim()] = currentValue;
          currentKey = '';
          currentValue = '';
          inKey = true;
          inValue = false;
          quoteChar = null;
        } else {
          currentValue += char;
        }
      } else if (char === '=' && inKey) {
        inKey = false;
        inValue = true;
        const nextIndex = i + 1;
        const nextChar =
          nextIndex < tagContent.length ? tagContent[nextIndex] : ' ';
        quoteChar = (nextChar === '"' || nextChar === "'") ? nextChar : null;
      } else if (char === ' ' && inKey && currentKey) {
        attributes[currentKey.trim()] = 'true';
        currentKey = '';
      } else if (inKey) {
        currentKey += char;
      }
    }

    if (isTagName) {
      name = currentKey.trim();
    } else if (currentKey) {
      attributes[currentKey.trim()] = inValue ?
        currentValue.replace(/^["']/, '').replace(/["']$/, '') :
        'true';
    }

    return {
      name,
      arr: attributes as AttributeMap,
    };
  }

  /**
   * 拆分输入文本为 Token 流：Tag、TagEnd、Content
   * 新增：忽略 HTML 注释 <!-- ... --> 并记录每个 token 的起始位置与行号
   */
  * tagSplitIterator(): IterableIterator<Token & { startIndex?: number; endIndex?: number; startLine?: number }> {
    const text = this.text;
    let i = 0;
    let line = 1;
    const len = text.length;

    while (i < len) {
      const ch = text[i];

      if (ch === '<') {
        // 检查注释 <!-- ... -->
        if (text.startsWith('!--', i + 1)) {
          const commentStart = i;
          const endIdx = text.indexOf('-->', i + 4);
          const commentEnd = endIdx === -1 ? len - 1 : endIdx + 2;
          // 更新行号
          const segment = text.slice(i, commentEnd + 1);
          for (const c of segment) if (c === '\n') line++;
          i = commentEnd + 1;
          continue; // 跳过注释
        }

        // 普通标签读取到 '>'
        const tokenStart = i;
        const tokenStartLine = line;
        let j = i + 1;
        let sawGt = false;
        for (; j < len; j++) {
          const c = text[j];
          if (c === '>') {
            sawGt = true;
            break;
          }
          if (c === '\n') line++;
        }
        const tokenEnd = j;
        const buffer = text.slice(tokenStart, sawGt ? j + 1 : len);
        const type: TokenType = buffer.startsWith('</') ? 'TagEnd' : 'Tag';
        const tok: any = {
          data: buffer,
          type,
          startIndex: tokenStart,
          endIndex: sawGt ? tokenEnd : len - 1,
          startLine: tokenStartLine
        };
        yield tok;
        i = sawGt ? j + 1 : len;
      } else {
        // 内容直到下一个 '<'
        const contentStart = i;
        const contentStartLine = line;
        let j = i;
        for (; j < len; j++) {
          const c = text[j];
          if (c === '<') break;
          if (c === '\n') line++;
        }
        const data = text.slice(contentStart, j);
        const n: any = {
          data,
          type: 'Content',
          startIndex: contentStart,
          endIndex: j - 1,
          startLine: contentStartLine
        };
        yield n;
        i = j;
      }
    }
  }

  /**
   * 生成 Token 迭代器，用于遍历所有结构化 Token
   * 改为基于 stack 的解析以支持嵌套，并为 ParsedTagNode 添加 loc: { start:{line,index}, end:{line,index} }
   * Content 改为递归节点数组 (ParsedTagContentNode | ParsedTagNode)[]
   */
  * tokenIterator(): IterableIterator<ParsedTagNode> {
    const rawTokens = Array.from(this.tagSplitIterator());
    const root: (ParsedTagNode | ParsedTagContentNode)[] = [];
    const stack: any[] = [];

    for (let idx = 0; idx < rawTokens.length; idx++) {
      const token = rawTokens[idx] as any;
      if (!token) continue;

      if (token.type === 'Content') {
        const contentNode: ParsedTagContentNode = {
          data: token.data,
          type: 'TagContent'
        };
        if (stack.length > 0) {
          const top = stack[stack.length - 1];
          top.content.push(contentNode);
        } else {
          root.push(contentNode);
        }
      } else if (token.type === 'Tag') {
        const inner = token.data.slice(1, -1).trim();
        // 自闭合 <br/> 或 <img ... /> 也当作单节点（没有 end），这里简单检测末尾 '/'
        const isSelfClosing = inner.endsWith('/');
        const arr = this.parseAttributes(isSelfClosing ? inner.slice(0, -1).trim() : inner);
        const node: any = {
          start: token,
          name: arr.name,
          arr: arr.arr,
          // content 现在是一个数组，包含文本节点或子标签
          content: [] as (ParsedTagContentNode | ParsedTagNode)[],
          end: null,
          // loc: start/end positions will be set when available
          loc: {
            start: { line: token.startLine || 1, index: token.startIndex || 0 },
            end: { line: token.startLine || 1, index: token.endIndex || (token.startIndex || 0) }
          } as { start: { line: number; index: number }; end: { line: number; index: number } }
        };

        if (isSelfClosing) {
          // self-closing: immediately close and attach to parent or root
          if (stack.length > 0) {
            stack[stack.length - 1].content.push(node);
          } else {
            // yield top-level node
            yield node;
          }
        } else {
          stack.push(node);
        }
      } else if (token.type === 'TagEnd') {
        // 从 '</name>' 中提取 name
        const name = token.data.replace(/^<\/\s*/, '').replace(/\s*>$/, '').trim();
        // 找到最近的匹配开始标签
        for (let s = stack.length - 1; s >= 0; s--) {
          const candidate = stack[s];
          if (candidate && candidate.name === name) {
            // 设置结束
            candidate.end = token;
            candidate.loc.end = { line: token.startLine || candidate.loc.start.line, index: token.endIndex || (token.loc.start.index) };
            // 从 stack 中移除并附加到父节点或作为顶层节点产出
            stack.splice(s, 1);
            if (stack.length > 0) {
              stack[stack.length - 1].content.push(candidate);
            } else {
              // yield completed top-level node
              yield candidate;
            }
            break;
          }
        }
        // 如果没有匹配的开始标签，则忽略（或可扩展为错误处理）
      }
    }

    // 如果有未闭合的标签，则把它们作为顶层节点输出（保留当前内容）
    while (stack.length > 0) {
      const node = stack.shift();
      if (stack.length > 0) {
        stack[0].content.push(node);
      } else {
        yield node;
      }
    }
  }

  /**
   * 创建一个动态布尔属性访问的 Proxy（可选功能）
   */
  getBooleanCheckProxy(): Record<string, boolean> {
    if (!this.booleanProxyCache.has(this)) {
      const charMap = new Map<string,
        boolean>();
      const proxy = new Proxy({}, {
        get(_: any, prop: string | symbol): boolean {
          if (typeof prop !== 'string') return false;
          return charMap.get(prop) || false;
        },
        set(_: any, prop: string | symbol, value: any): boolean {
          if (typeof prop !== 'string') return false;
          charMap.set(prop, Boolean(value));
          return true;
        },
      });
      this.booleanProxyCache.set(this, proxy);
    }
    return this.booleanProxyCache.get(this) as Record<string, boolean>;
  }
}
export default class McxAst {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }
  private getAST(): ParsedTagNode[] {
    const lexer = new Lexer(this.text);
    // 现在 tokenIterator 直接产生顶层 ParsedTagNode（并且注释已被忽略）
    return Array.from(lexer.tokens);
  }
  get data(): ParsedTagNode[] {
    return this.getAST();
  }
  parseAST(): ParsedTagNode[] {
    return this.getAST();
  }

  /**
   * 生成代码字符串（递归处理 content 数组）
   * @param node 要生成代码的AST节点
   * @returns 生成的代码字符串
   */
  static generateCode(node: ParsedTagNode): string {
    let code = `<${node.name}`;
    // 添加属性
    for (const [key, value] of Object.entries((node as any).arr || {})) {
      if (value === 'true') {
        code += ` ${key}`;
      } else {
        code += ` ${key}=${value}`;
      }
    }
    code += '>';
    // 添加内容（content 现在为数组）
    const contentArr = (node as any).content as (ParsedTagContentNode | ParsedTagNode)[] | null;
    if (Array.isArray(contentArr)) {
      for (const item of contentArr) {
        if ((item as ParsedTagContentNode).type === 'TagContent') {
          code += (item as ParsedTagContentNode).data;
        } else {
          code += McxAst.generateCode(item as ParsedTagNode);
        }
      }
    }

    // 添加结束标签
    code += `</${node.name}>`;

    return code;
  }
}
export class MCXUtils {
  static isTagNode(node: any): node is ParsedTagNode {
    return (
      node &&
      typeof node === 'object' &&
      'start' in node &&
      'name' in node &&
      'arr' in node &&
      'content' in node &&
      'end' in node
    );
  }
  static isTagContentNode(node: any): node is ParsedTagContentNode {
    return (
      node &&
      typeof node === 'object' &&
      'data' in node &&
      'type' in node &&
      node.type === 'TagContent'
    );
  }
  static isAttributeMap(obj: any): obj is AttributeMap {
    return (
      obj &&
      typeof obj === 'object' &&
      !Array.isArray(obj)
    );
  }
  static isToken(obj: any): obj is Token {
    return (
      obj &&
      typeof obj === 'object' &&
      'data' in obj &&
      'type' in obj &&
      (obj.type === 'Tag' || obj.type === 'TagEnd' || obj.type === 'Content')
    );
  }
  static isTagToken(obj: any): obj is TagToken {
    return (
      MCXUtils.isToken(obj) &&
      obj.type === 'Tag'
    );
  }
  static isTagEndToken(obj: any): obj is TagEndToken {
    return (
      MCXUtils.isToken(obj) &&
      obj.type === 'TagEnd'
    );
  }
  static isContentToken(obj: any): obj is ContentToken {
    return (
      MCXUtils.isToken(obj) &&
      obj.type === 'Content'
    );
  }
  static isBaseToken(obj: any): obj is BaseToken {
    return (
      obj &&
      typeof obj === 'object' &&
      'data' in obj &&
      'type' in obj
    );
  }
  static isTokenType(value: any): value is TokenType {
    return (
      value === 'Tag' ||
      value === 'TagEnd' ||
      value === 'Content'
    );
  }
  static isParseNode(node: any): node is ParsedTagNode[] {
    return (
      Array.isArray(node) &&
      node.every(MCXUtils.isTagNode)
    );
  }
}