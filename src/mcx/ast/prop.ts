import type {
  PropNode,
  PropValue
} from "../types.js";

const STATUS = [0, 1]; // 0: 搜集 key，1: 搜集 value

export class Lexer {
  private code: string;

  constructor(code: string) {
    this.code = code;
  }

  // 对外暴露的 tokenize 方法（生成器函数）
  * tokenize(): IterableIterator < PropNode > {
    let currStatus = STATUS[0]; // 0: key，1: value
    let key = "";
    let value = "";
    let hasEquals = false;

    for (const char of this.code) {
      if (/\s/.test(char)) {
        if (char === '\n') {
          if (currStatus === STATUS[1] && key && value) {
            const propNode: PropNode = {
              key,
              value: this.HandlerValue(value),
              type: "PropChar"
            }
            yield propNode;
          } else if (currStatus === STATUS[0] && key) {}
          key = "";
          value = "";
          hasEquals = false;
          currStatus = STATUS[0];
        }
        continue; // 跳过所有空白字符
      }

      if (char === '=') {
        if (currStatus === STATUS[0]) {
          currStatus = STATUS[1]; // 切换到 value 状态
          hasEquals = true;
        }
      } else {
        if (currStatus === STATUS[0]) {
          key += char; // 搜集 key
        } else if (currStatus === STATUS[1]) {
          value += char; // 搜集 value
        }
      }
    }
    if (key && value) {
      const propNode: PropNode = {
        key,
        value: this.HandlerValue(value),
        type: "PropChar"
      }
      yield propNode;
    }
  }
  HandlerValue(value: string): PropValue {
    try {
      const num = Number(value);
      if (!Number.isNaN(num)) return num;
      if (["[", "{"].includes(value.slice(0, 1)) && ["]", "}"].includes(value.slice(-1))) {
        return JSON.parse(value)
      }
    } catch {}
    return value;
  }
}

// 默认导出解析函数
export default function PropParser(code: string): PropNode[] {
  const lexer = new Lexer(code);
  return Array.from(lexer.tokenize());
}