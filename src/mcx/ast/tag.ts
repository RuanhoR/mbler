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
  private booleanProxyCache: WeakMap < object, any > ;
  constructor(text: string) {
    this.text = text;
    this.booleanProxyCache = new WeakMap();
  }
  get tokens(): Iterable < ParsedTagNode > {
    return {
      [Symbol.iterator]: () => this.tokenIterator()
    };
  }
  /**
   * 解析标签属性，如：<div id="app" disabled />
   */
  parseAttributes(tagContent: string): {
    name: string;arr: AttributeMap
  } {
    const attributes: Record < string, string > = {};
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
   */
  * tagSplitIterator(): IterableIterator < Token > {
    let inTag = false;
    let buffer = '';
    let inContent = false;
    let contentBuffer = '';

    for (const char of this.text) {
      if (char === '<') {
        if (contentBuffer) {
          const n: ContentToken = {
            data: contentBuffer,
            type: 'Content'
          }
          yield n;
          contentBuffer = '';
        }

        inTag = true;
        buffer = '<';
      } else if (char === '>') {
        if (!inTag) {
          throw new Error("未匹配的 '>'");
        }

        buffer += '>';
        inTag = false;

        const type: TokenType = buffer.startsWith('</') ? 'TagEnd' : 'Tag';
        const n: TagToken | TagEndToken = {
          data: buffer,
          type
        };
        yield n
        buffer = '';
      } else if (inTag) {
        buffer += char;
      } else {
        contentBuffer += char;
      }
    }

    if (contentBuffer) {
      const n: ContentToken = {
        data: contentBuffer,
        type: 'Content'
      }
      yield n;
    }
  }

  /**
   * 生成 Token 迭代器，用于遍历所有结构化 Token
   */
  * tokenIterator(): IterableIterator < ParsedTagNode > {
    const tagTokens: Token[] = Array.from(this.tagSplitIterator());
    let currentTag: ParsedTagNode | null = null;
    let contentStartIndex = 0;

    for (let i = 0; i < tagTokens.length; i++) {
      const token = tagTokens[i];
      if (!token) continue;
      if (token.type === 'Tag') {
        const arr = this.parseAttributes(token.data.slice(1, -1));
        currentTag = {
          start: token as TagToken,
          name: arr.name,
          arr: arr.arr,
          content: null,
          end: null,
        };
        contentStartIndex = i + 1;
      } else if (token.type === 'TagEnd' && currentTag) {
        currentTag.end = token as TagEndToken;

        let contentData = '';
        for (let j = contentStartIndex; j < i; j++) {
          const contentToken = tagTokens[j] as ContentToken;
          contentData += contentToken.data;
        }

        const n: ParsedTagContentNode = {
          data: contentData,
          type: 'TagContent',
        };
        currentTag.content = n;
        // 构造最终的 ParsedTagNode
        const tagNode: ParsedTagNode = {
          start: currentTag.start,
          name: currentTag.name,
          arr: currentTag.arr,
          content: currentTag.content,
          end: currentTag.end,
        };

        yield tagNode; // 直接 yield 结构化 AST 节点
        currentTag = null;
      }
    }
  }

  /**
   * 创建一个动态布尔属性访问的 Proxy（可选功能）
   */
  getBooleanCheckProxy(): Record < string, boolean > {
    if (!this.booleanProxyCache.has(this)) {
      const charMap = new Map < string,
        boolean > ();
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
    return this.booleanProxyCache.get(this) as Record < string, boolean > ;
  }
}
export default class McxAst {
  private text: string;

  constructor(text: string) {
    this.text = text;
  }
  private getAST(): ParsedTagNode[] {
    const lexer = new Lexer(this.text);
    return Array.from(lexer.tokens);
  }
  get data(): ParsedTagNode[] {
    return this.getAST();
  }
  parseAST(): ParsedTagNode[] {
    return this.getAST();
  }
}