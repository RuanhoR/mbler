import path from 'node:path';
import Zip from 'adm-zip'
import Logger from "./../loger/index.js"
import {
  Input as commander
} from "./../commander";
import config from './../build/build-g-config.json' assert {
  type: "json"
}
import fs from "node:fs/promises"
export function hasKeys(obj, keys, minValue) {
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
export const input = function(): (t: string, g: boolean): Promise < (t: string = "", g: boolean = true) => Promise < string > > {
  let curr;
  let currstr = "";
  let tip = "";
  let show = true;
  // 在输入时使用输入中间件
  commander.use(function(name: string, ctrl: boolean, alt: boolean, raw: string): void {
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
  return async function(t: string = "", g: boolean = true): Promise < string > {
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
export async function zip(sourceDir: string, outputFile: string): Promise < void > {
  const zip = new Zip();
  for (let item of sourceDir) {
    if (typeof item !== "string") continue;
    zip.addLocalFolder(item);
  }
  await zip.writeZipPromise(outputFile);
}
export const waitGC = (): Promise < void > => new Promise(r => setImmediate(r));
export function toString(t: any): string {
  if (typeof t === 'string') return t;
  if (t instanceof Error) return t.stack;
  if (Array.isArray(t)) return t.map((item: any): string => toString(item)).join('\n');
  if (typeof t?.toString === 'function') return t.toString();
  if (t === void 0) return '[Objeect utils]'
  return JSON.stringify(t, null, 2);
}
export function ToArray(str: string): [number, number, number][] {
  return str.split(`.`).map(Number);
}
export const sleep = (ms: number = 100): Promise < void > => new Promise(resolve => setTimeout(resolve, ms));
type ParseReadFileOpt = {
  delay: number;
  maxRetries: number;
  want: 'string' | 'object';
};
type ReadFileOpt = Partial < ParseReadFileOpt >
  type TypeMap = {
    object: Object
    string: string
  }
type ParseReadFileOpt = {
  delay: number;
  maxRetries: number;
  want: 'string' | 'object';
};
export async function readFileWithRetry(
  filePath: string,
  opt: {
    want: 'string';delay ? : number;maxRetries ? : number
  }
): Promise < string > ;

export async function readFileWithRetry(
  filePath: string,
  opt: {
    want: 'object';delay ? : number;maxRetries ? : number
  }
): Promise < Object > ;
export async function readFileWithRetry(
  filePath: string,
  opt: {
    want: 'string' | 'object';delay ? : number;maxRetries ? : number
  }
): Promise < string | Object > {
  const opts = {
    maxRetries: 5,
    delay: 200,
    want: 'string',
    ...opt
  }
  let lastError;
  for (let attempt = 0; attempt < opts.maxRetries; attempt++) {
    try {
      let text = await fs.readFile(filePath);
      if (opts.want === 'string') text = text.toString()
      if (opts.want === 'object') {
        try {
          text = JSON.parse(text)
        } catch {
          text = {}
        }
      }
      return text;
    } catch (err) {
      lastError = err;
      if (attempt < opts.maxRetries - 1) {
        await sleep(opts.delay);
      }
    }
  }
  return {};
}
export const JSONparse = function(str: string): Object {
  return JSON.parse(str);
}
export function join(baseDir: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ?
    inputPath :
    path.join(baseDir, inputPath);
}
export const isVerison = function(str: string): boolean {
  return /\d+\.\d+\.\d+/.test(str)
}
export function Exit(msg: string): void {
  Logger.e('ERROR', msg);
  process.exit(1)
}
export async function FileExsit(dir: string): Promise < boolean > {
  try {
    await fs.access(dir);
    return true
  } catch (err) {
    return false
  }
}
export type MblerDesConfig = {
  [string key]: string
}
export type MblerConfigScript = {
  ui: boolean,
  lang ? : string,
  main: string,
  dependencies ? : MblerDesConfig
}
export type MblerConfigData = {
  name: string
  description: string
  version: string
  mcVersion: string
  script ? : MblerConfigScript
  minify ? : boolean
}
export async function GetData(dir: string): MblerConfigData {
  const configPath = path.join(dir, config.PackageFile);
  const fileContent = await fs.readFile(configPath, 'utf-8')
  const data = JSONparse(fileContent);
  if (typeof data.version === "string" && typeof data.mcVersion === "string" && typeof data.name === "string" && typeof data.description === "string") return data;
  throw new Error("[mbler find config]: " + dir + ": not found config")
}
export async isMblerProject(Dir: string): Promise < boolean > {
  const rel = await Promise.all([
    path.join(Dir, "package.json"),
    path.join(Dir, BuildConfig.PackageFile)
  ].map(FileExsit)).catch((e: Error): boolean[] => console.log(e.stack) || [false, false]);
  const res = rel.every(Boolean);
  return res
}
/**
 * 检查版本号是否有效（有效返回 true）
 * @param {any} v
 * @returns {boolean}
 */
function isValidVersion(v: any): boolean {
  return typeof v === 'string' && isVersion(v);
}
type handlerPackageResult = {
  des: string[]
  ui: boolean
  main: string
  name
}
type handlerPackageDes = {
  des: string[]
}
/**
 * 处理模块包配置，提取依赖、主入口、UI 配置等
 * @param {string} dir 模块目录路径
 * @param {Object} opt 可选参数（如：已处理的依赖列表）
 * @returns {Promise<Object>} { des: string[], ui: boolean, main: string }
 */
export async function handlerPackage(dir: string, opt: handlerPackageDes = {}): handlerPackageResult {
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
  const result: handlerPackageResult = {
    des: [], // 依赖模块名数组
    ui: false, // 是否使用 @minecraft/server-ui
    main: './index.js' // 默认主入口
    name: data.name,
    version: data.version,
    description: data.description
  };
  // opt.des : Type Array || undefined
  if (opt.des && data?.script?.dependencies) result.des = ForOfMod(data.script.dependencies, opt.des)
  result.ui = Boolean(Boolean(data?.script?.ui));
  if (isNonEmptyString(data?.script?.main)) {
    result.main = data.script.main;
  }
  return result;
};

// 工具函数：判断非空字符串
function isNonEmptyString(str: any): boolean {
  return typeof str === 'string' && str.trim().length > 0;
}

function ForOfMod(Mod, InstallMod) {
  // Mod : {name:git}
  let returnValue = {};
  try {
    for (const [packageName, gitRepo] of Object.entries(Mod)) {
      // InstallMod: Array<String: packageName>
      if (typeof InstallMod?.includes === 'function')
        if (InstallMod?.includes(packageName)) continue;
      returnValue[packageName] = gitRepo;
    }
  } catch {}
  return returnValue;
}