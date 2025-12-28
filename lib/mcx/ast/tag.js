class Lexer {
  constructor(text) {
    this.text = text;
    this.booleanProxyCache = new WeakMap();
  }

  get tokens() {
    return {
      [Symbol.iterator]: this.tokenIterator.bind(this)
    };
  }
  parseAttributes(tagContent) {
    const attributes = {};
    let currentKey = '';
    let currentValue = '';
    let inKey = true;
    let name = "";
    let inValue = false;
    let quoteChar = null;
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
        const nextChar = tagContent[tagContent.indexOf(char, tagContent.indexOf(currentKey)) + 1];
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
      attributes[currentKey.trim()] = inValue ? currentValue : "true";
    }

    return {
      name,
      arr: attributes
    };
  }

  * tokenIterator() {
    const tagTokens = Array.from(this.tagSplitIterator());
    let currentTag = {};
    let contentStartIndex = 0;

    for (let i = 0; i < tagTokens.length; i++) {
      const token = tagTokens[i];

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
      } else if (token.type === "TagEnd" && currentTag) {
        currentTag.end = token;

        let contentData = '';
        for (let j = contentStartIndex; j < i; j++) {
          contentData += tagTokens[j].data;
        }

        currentTag.content = {
          data: contentData,
          type: "TagContent"
        };

        Object.freeze(currentTag.start);
        Object.freeze(currentTag.end);
        Object.freeze(currentTag.content);
        Object.seal(currentTag); // 密封整个标签对象

        yield currentTag;
        currentTag = null;
      }
    }
  }

  * tagSplitIterator() {
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

  getBooleanCheckProxy() {
    if (!this.booleanProxyCache.has(this)) {
      const charMap = new Map();
      const proxy = new Proxy({}, {
        get(_, prop) {
          return charMap.get(prop) || false;
        },
        set(_, prop, value) {
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
  constructor(text) {
    this.text = text;
  }
  get data() {
    return this.generateAst();
  }
  generateAst() {
    const lexer = new Lexer(this.text);
    return Array.from(lexer.tokens);
  }
}

module.exports = McxAst;