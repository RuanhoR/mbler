import fs from "node:fs/promises";
import path from "node:path"
import type {
  ReadFileOpt,
  ParseReadFileOpt,
  TypeVerifyBody
} from "./types.js"
export default class McxUtlis {
  /**
   * 检查文件是否存在
   * @param path 文件路径
   * @returns 是否存在
   */
  public static async FileExsit(path: string): Promise < boolean > {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 读取文件内容，支持返回 string 或 object，带重试机制
   * @param filePath 文件路径
   * @param opt 配置选项
   * @returns 文件内容（string | object），出错时返回 {}
   */
  public static async readFile(
    filePath: string,
    opt: ReadFileOpt = {}
  ): Promise < object | string > {
    // 补全必填字段，确保类型安全
    const opts: ParseReadFileOpt = {
      delay: 200, // 默认延迟
      maxRetries: 3, // 默认最大重试次数
      want: 'string', // 默认返回字符串
      ...opt, // 用户传入的配置覆盖默认值
    };

    for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
      try {
        const buffer: Buffer = await fs.readFile(filePath);
        let text: string | object;
        if (opts.want === 'string') {
          text = buffer.toString(); // Buffer -> string
        } else if (opts.want === 'object') {
          try {
            text = JSON.parse(buffer.toString()); // Buffer -> string -> object
          } catch (parseErr) {
            // JSON 解析失败时返回空对象
            text = {};
          }
        } else {
          // 默认情况也返回字符串
          text = buffer.toString();
        }

        return text;

      } catch (err: any) {
        // 如果不是最后一次尝试，则等待后重试
        if (attempt < opts.maxRetries - 1) {
          await McxUtlis.sleep(opts.delay);
        }
      }
    }
    return opts.want === 'object' ? {} : '';
  }
  public static sleep(time: number): Promise < void > {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
  // 在运行时进行对象类型验证
  public static TypeVerify(obj: any, types: TypeVerifyBody) {
    for (const item of Object.entries(types)) {
      const [key, ShouldType]: [string, string] = item;
      if (!(typeof obj[key] === ShouldType)) return false;
    }
    return true;
  }
  public static AbsoluteJoin(baseDir: string, inputPath: string): string {
    return path.isAbsolute(inputPath) ?
      inputPath :
      path.join(baseDir, inputPath);
  }
}