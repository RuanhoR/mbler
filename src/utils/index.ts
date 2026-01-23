import path from 'node:path';
import Zip from 'adm-zip'
import Logger from "./../loger/index.js"
import {
  Input as commander
} from "./../commander";
const config = require('./../build/build-g-config.json')
import fs from "node:fs/promises"
export function hasKeys(obj: any, keys: Array<string>, minValue: number): boolean {
  if (
    !(typeof obj === `object` &&
      !Array.isArray(obj)
    )) return false;
  if (!Array.isArray(keys)) return false;
  let count = 0;
  for (const key of keys) {
    if (obj.hasOwnProperty(key)) {
      count++;
      if (count >= minValue) return true;
    }
  }
  return false;
}
export const input = function (): (t: string, g?: boolean) => Promise<string> {
  type InputCallBack = (a: string) => void;
  let curr: null | InputCallBack;
  let currstr = "";
  let tip = "";
  let show = true;
  // 在输入时使用输入中间件
  commander.use(function (name: string, ctrl: boolean, alt: boolean, raw: string): void {
    if (typeof curr !== "function") return;
    if (ctrl || alt) return;
    if (raw) {
      if (raw === 'return' || raw === 'enter') {
        curr(currstr);
        curr = null;
        currstr = "";
        console.log("")
        return;
      }
      if (raw === 'backspace') {
        currstr = currstr.slice(0, -1);
        refreshInput();
        return;
      }
    }
    if (name && typeof name === 'string' && name.length === 1) {
      currstr += name;
      refreshInput();
    }
  });

  function refreshInput(): void {
    const out = `\x1b[2K\r${tip}${show ? currstr : ""}`;
    process.stdout.write(out);
  }
  /**
   * 输入文本
   * @param{string} tip 提示
   * @param{boolean} show 是否显示输入
   */
  return async function (t: string = "", g: boolean = true): Promise<string> {
    return new Promise((resolve) => {
      show = g;
      tip = t;
      refreshInput();
      curr = resolve;
    });
  };
}()
/**
 * 压缩目录为 ZIP，解压后根目录是 sourceDir 内的内容，而不是 sourceDir 文件夹本身
 * @param {Array} sourceDir 要压缩的目录路径，如 ['C:/data/myfolder' 或 '/home/user/myfolder']
 * @param {string} outputFile 输出的 ZIP 文件完整路径，如 'C:/backup/output.zip' 或 '/backup/output.zip'
 * @returns {Promise<boolean>} 是否压缩成功
 */
export async function zip(sourceDir: string[], outputFile: string): Promise<void> {
  const zip = new Zip();
  for (let item of sourceDir) {
    if (typeof item !== "string") continue;
    zip.addLocalFolder(item);
  }
  await zip.writeZipPromise(outputFile);
}
export const waitGC = (): Promise<void> => new Promise(r => setImmediate(r));
export function toString(t: any): string {
  if (typeof t === 'string') return t;
  if (t instanceof Error) {
    if (typeof t.stack == "string") return t.stack
    return t.message;
  };
  if (Array.isArray(t)) return t.map((item: any): string => toString(item)).join('\n');
  if (typeof t?.toString === 'function') return t.toString();
  if (t === void 0) return '[Objeect utils]'
  return JSON.stringify(t, null, 2);
}
export function ToArray(str: string): number[] {
  return str.split(`.`).map(Number);
}
export const sleep = (ms: number = 100): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));
import type {
  ParseReadFileOpt,
  ReadFileOpt
} from '../types';
export async function readFileWithRetry(
  filePath: string,
  opt: {
    want: 'string'; delay?: number; maxRetries?: number
  }
): Promise<string>;

export async function readFileWithRetry(
  filePath: string,
  opt: {
    want: 'object'; delay?: number; maxRetries?: number
  }
): Promise<Object>;

/**
 * 读取文件内容
 * @param filePath 文件路径
 * @param opt 选项，包含 want: 'string' | 'object'
 * @returns 文件内容（字符串或解析后的对象）
 */
export async function readFileWithRetry(
  filePath: string,
  opt: ReadFileOpt
): Promise<string | Object> {
  const opts: ParseReadFileOpt = {
    maxRetries: 5,
    delay: 200,
    want: 'string',
    ...opt
  }
  let lastError;
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      let resu: string | Object = ""
      const text = (await fs.readFile(filePath)).toString();
      if (opts.want === 'string') resu = text.toString()
      if (opts.want === 'object') {
        try {
          resu = JSON.parse(text)
        } catch {
          resu = {}
        }
      }
      return resu;
    } catch (err) {
      lastError = err;
      if (attempt < opts.maxRetries - 1) {
        await sleep(opts.delay);
      }
    }
  }
  return {};
}
export const readFile = readFileWithRetry;
export const JSONparse = function (str: string): any {
  return JSON.parse(str);
}
export function join(baseDir: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ?
    inputPath :
    path.join(baseDir, inputPath);
}
export const isVerison = function (str: string): boolean {
  return /\d+\.\d+\.\d+/.test(str)
}
export function Exit(msg: string): void {
  Logger.e('ERROR', msg);
  process.exit(1)
}
export async function FileExsit(dir: string): Promise<boolean> {
  try {
    await fs.access(dir);
    return true
  } catch (err) {
    return false
  }
}
import type {
  MblerDesConfig,
  MblerConfigScript,
  MblerConfigData
} from '../types';
export async function GetData(dir: string): Promise<MblerConfigData> {
  const configPath = path.join(dir, config.PackageFile);
  const fileContent = await fs.readFile(configPath, 'utf-8')
  const data = JSONparse(fileContent);
  if (typeof data.version === "string" && typeof data.name === "string" && typeof data.description === "string") return data;
  throw new Error("[mbler find config]: " + dir + ": not found config")
}
export async function isMblerProject(Dir: string): Promise<boolean> {
  const rel = await Promise.all([
    path.join(Dir, "package.json"),
    path.join(Dir, config.PackageFile)
  ].map(FileExsit)).catch((e: Error): boolean[] => {
    console.log(e.stack)
    return [false, false]
  });
  const res = rel.every(Boolean);
  return res
}
/**
 * 检查版本号是否有效（有效返回 true）
 * @param {any} v
 * @returns {boolean}
 */
function isValidVersion(v: any): boolean {
  return typeof v === 'string' && isVerison(v);
}
import type {
  HandlerPackageResult,
  HandlerPackageDes
} from '../types';
import { readFileSync } from 'node:fs';
/**
 * 处理模块包配置，提取依赖、主入口、UI 配置等
 * @param {string} dir 模块目录路径
 * @param {Object} opt 可选参数（如：已处理的依赖列表）
 * @returns {Promise<Object>} { des: string[], ui: boolean, main: string }
 */
export async function handlerPackage(dir: string, opt: HandlerPackageDes = {
  des: []
}): Promise<HandlerPackageResult> {
  let data;
  try {
    data = await GetData(dir);
  } catch (err) {
    throw new Error(`无法读取模块配置文件: ${path.join(dir, config.PackageFile)}`);
  }
  // 必需字段校验
  if (
    typeof data.name !== 'string' ||
    typeof data.description !== 'string' ||
    !isValidVersion(data.version)
  ) {
    throw new Error(
      `ERR-\n${path.join(dir, config.PackageFile)} 缺少必要字段。\n` +
      '必需字段: name, description, version'
    );
  }
  const result: HandlerPackageResult = {
    des: {}, // 依赖模块名数组
    ui: false, // 是否使用 @minecraft/server-ui
    main: './index.js', // 默认主入口
    name: data.name,
    version: data.version,
    description: data.description
  };
  // opt.des : Type Array || undefined
  if (opt.des && data?.script?.dependencies) result.des = ForOfMod(data.script.dependencies, opt.des)
  result.ui = Boolean(Boolean(data?.script?.ui));
  if (data?.script) {
    result.main = data.script.main;
  }
  return result;
};

/**
 *  * 遍历模块依赖配置，过滤掉已经安装的模块
 * @param Mod 模块依赖对象，key 是包名，value 是 Git 地址，例如 { "module-a": "git-url" }
 * @param InstallMod 已安装的模块名数组，例如 ["module-a", "module-b"]
 * @returns 过滤后的模块对象，只包含未安装的模块
 */
function ForOfMod(
  Mod: {
    [packageName: string]: string
  }, // 比如 { "pkg": "git-url" }
  InstallMod: string[] | undefined // 比如 ["pkg1", "pkg2"]
): {
  [packageName: string]: string
} { // 返回的也是 { "pkg": "git-url" }，过滤后的
  let returnValue: {
    [packageName: string]: string
  } = {};
  try {
    for (const [packageName, gitRepo] of Object.entries(Mod)) {
      if (
        InstallMod?.includes &&
        typeof InstallMod.includes === 'function' &&
        InstallMod.includes(packageName)
      ) {
        continue; // 如果已安装，跳过
      }
      returnValue[packageName] = gitRepo;
    }
  } catch (err) {
    console.error('ForOfMod 发生错误:', err);
  }
  return returnValue;
}
export async function copy(src: string, out: string) {
  try {
    await fs.cp(src, out, {
      force: true,
      recursive: true
    })
  } catch (err) { }
};
const iconfig = require("./../build/build-g-config.json")
export {iconfig  as config}