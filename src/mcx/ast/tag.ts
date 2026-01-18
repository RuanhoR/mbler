import type { 
  Token, 
  ParsedTagNode, 
  ParsedTagContentNode, 
  AttributeMap 
} from '../types';

class Lexer {
  private text: string;
  private booleanProxyCache: WeakMap<any, any>;

  constructor(text: string) {
    this.text = text;
    this.booleanProxyCache = new WeakMap();
  }

  get tokens(): IterableIterator<ParsedTagNode> {
    return {
      [Symbol.iterator]: this.tokenIterator.bind(this)
    } as IterableIterator<ParsedTagNode>;
  }

  parseAttributes(tagContent: string): { name: string; arr: AttributeMap } {
    const attributes: AttributeMap = {};
    let currentKey = '';
    let currentValue = '';
    let inKey = true;
    let name = "";
    let inValue = false;
    let quoteChar: string | null = null;
    let isTagName = true; // 标记是否在解析标签名阶段

    for (const char of tagContent) {
      if (isTagName) {
        if (char === ' ' || char === '>') {
          name = currentKey.trim();
          currentKey = '';
          isTagName = false;
          if (char === '>') break; // 标签结束
        } else {
          currentKey += char;
        }
        continue;
      }

      if (inValue) {
        if (char === quoteChar && currentValue[currentValue.length - 1] !== '\\') {
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
        const nextIndex = tagContent.indexOf(char, tagContent.indexOf(currentKey)) + 1;
        const nextChar = tagContent[nextIndex];
        quoteChar = (nextChar === '"' || nextChar === "'") ? nextChar : null;
      } else if (char === ' ' && inKey && currentKey) {
        attributes[currentKey.trim()] = "true";
        currentKey = '';
      } else if (inKey) {
        currentKey += char;
      }
    }

    if (isTagName) {
      name = currentKey.trim();
    } else if (currentKey) {
      attributes[currentKey.trim()] = inValue ? currentValue.replace(/^["']/, "").replace(/["']$/, "") : "true";
    }

    return {
      name,
      arr: attributes
    };
  }

  * tokenIterator(): IterableIterator<ParsedTagNode> {
    const tagTokens = Array.from(this.tagSplitIterator());
    let currentTag: Partial<ParsedTagNode> = {};
    let contentStartIndex = 0;

    for (let i = 0; i < tagTokens.length; i++) {
      const token = tagTokens[i];
      if (!token) continue;
      if (token.type === "Tag") {
        const arr = this.parseAttributes(token.data.slice(1, -1));
        currentTag = {
          start: token,
          name: arr.name,
          arr: arr.arr, // 展开解析后的属性
          content: null,
          end: null
        };
        contentStartIndex = i + 1;
      } else if (token.type === "TagEnd" && currentTag.name) {
        currentTag.end = token;

        let contentData = '';
        for (let j = contentStartIndex; j < i; j++) {
          contentData += token.data;
        }

        currentTag.content = {
          data: contentData,
          type: "TagContent"
        } as ParsedTagContentNode;

        Object.freeze(currentTag.start);
        Object.freeze(currentTag.end);
        Object.freeze(currentTag.content);
        Object.seal(currentTag); // 密封整个标签对象

        yield currentTag as ParsedTagNode;
        currentTag = {};
      }
    }
  }

  * tagSplitIterator(): IterableIterator<Token> {
    let inTag = false;
    let buffer = '';
    let inContent = false;
    let contentBuffer = '';

    for (const char of this.text) {
      if (char === '<') {
        if (contentBuffer) {
          yield {
            data: contentBuffer,
            type: "Content"
          };
          contentBuffer = '';
        }

        inTag = true;
        buffer = '<';
      } else if (char === '>') {
        if (!inTag) throw new Error("未匹配的'>'");

        buffer += '>';
        inTag = false;

        yield {
          data: buffer,
          type: buffer.startsWith("</") ? "TagEnd" : "Tag"
        };

        buffer = '';
      } else if (inTag) {
        buffer += char;
      } else {
        contentBuffer += char;
      }
    }

    if (contentBuffer) {
      yield {
        data: contentBuffer,
        type: "Content"
      };
    }
  }

  getBooleanCheckProxy(): any {
    if (!this.booleanProxyCache.has(this)) {
      const charMap = new Map();
      const proxy = new Proxy({}, {
        get(_: any, prop: string | symbol) {
          return charMap.get(prop) || false;
        },
        set(_: any, prop: string | symbol, value: any) {
          charMap.set(prop, Boolean(value));
          return true;
        }
      });
      this.booleanProxyCache.set(this, proxy);
    }
    return this.booleanProxyCache.get(this);
  }
}

class McxAst {
  private text: string;

  /**
   * 构造标签解析ast
   * @param {string} text - 需要解析的文本
   */
  constructor(text: string) {
    this.text = text;
  }

  get data(): ParsedTagNode[] {
    return this.generateAst();
  }

  generateAst(): ParsedTagNode[] {
    const lexer = new Lexer(this.text);
    return Array.from(lexer.tokens);
  } 
}

export default function parser (code: string): ParsedTagNode[] {
  const asc = new McxAst(code)
  return asc.generateAst()
};