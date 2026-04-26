import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { MblerConfigData, npmFetchData, templateMblerConfig } from '../types'
import { Input } from '../commander'
import { json } from 'npm-registry-fetch'
import { spawn } from 'node:child_process'
import { BuildConfig } from '../build/config'
export async function FileExsit(file: string): Promise<boolean> {
  try {
    const f = await fs.stat(file)
    if (f) return true
  } catch {
    return false
  }
  return false
}
export function join(baseDir: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.join(baseDir, inputPath)
}
export async function ReadProjectMblerConfig(
  project: string
): Promise<MblerConfigData> {
  const fileExport = await import(path.join(project, BuildConfig.ConfigFile));
  const file = (fileExport as { default: MblerConfigData }).default || {};
  for (const key in file) {
    if (!(key in templateMblerConfig)) {
      throw new Error(
        `[read config]: read config from '${project}' error: Unexpected '${key}'`
      )
    }
  }
  return file
}
export async function readFileAsJson<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const json = JSON.parse(content)
    return json as T
  } catch (err: unknown) {
    if (err instanceof Error) {
      throw err
    } else {
      throw new Error(err as string)
    }
  }
}
export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time)
  })
}
/**
 * Print a single-line message to stdout with a trailing newline.
 * Exported here so other modules (for example `build`) do not need
 * to import from `cli`, avoiding a circular dependency.
 */
// IO缓冲队列，避免多线程写入冲突
let outputQueue: string[] = []
let isFlushing = false

export async function flushOutputQueue(): Promise<void> {
  if (isFlushing || outputQueue.length === 0) return
  isFlushing = true
  try {
    while (outputQueue.length > 0) {
      const chunk = outputQueue.shift()
      if (chunk) {
        process.stdout.write(chunk)
      }
    }
  } finally {
    isFlushing = false
  }
}
process.on("exit", flushOutputQueue)
export function showText(text: string, needNextLine: boolean = true) {
  outputQueue.push(text + (needNextLine ? '\n' : ""))
  if (!isFlushing) {
    Promise.resolve().then(() => flushOutputQueue()).catch(() => {
      outputQueue = []
      isFlushing = false
    })
  }
}
export function stringToNumberArray(str: string): [number, number, number] {
  return str
    .split('.')
    .map((s) => parseInt(s, 10))
    .slice(0, 3) as [number, number, number]
}
export async function writeJSON(filePath: string, data: any): Promise<void> {
  const content = JSON.stringify(data, null, 2)
  if (!(await FileExsit(path.dirname(filePath)))) {
    await fs
      .mkdir(path.dirname(filePath), { recursive: true })
      .catch(() => void 0)
  }
  return await fs.writeFile(filePath, content, 'utf-8')
}
export function compareVersion(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0)
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0)
  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0
    const nb = pb[i] || 0
    if (na !== nb) return na - nb
  }
  return 0
}
export const input = (function (): (t: string, g?: boolean) => Promise<string> {
  type InputCallBack = (a: string) => void
  let curr: null | InputCallBack
  let currstr = ''
  let tip = ''
  let show = true
  // 在输入时使用输入中间件
  Input.use(function (
    raw: string,
    ctrl: boolean,
    alt: boolean,
    name: string
  ): void {
    if (typeof curr !== 'function') return
    if (ctrl || alt) return
    if (raw) {
      if (raw === 'return' || raw === 'enter') {
        curr(currstr)
        curr = null
        currstr = ''
        console.log('\n')
        return
      }
      if (raw === 'backspace') {
        currstr = currstr.slice(0, -1)
        refreshInput()
        return
      }
    }
    if (name && typeof name === 'string') {
      currstr += name
      refreshInput()
    }
  })

  function refreshInput(): void {
    const out = `\x1b[2K\r${tip}${show ? currstr : ''}`
    process.stdout.write(out)
  }
  /**
   * 输入文本
   * @param{string} tip 提示
   * @param{boolean} show 是否显示输入
   */
  return async function (t: string = '', g: boolean = true): Promise<string> {
    return new Promise((resolve) => {
      show = g
      tip = t
      refreshInput()
      curr = resolve
    })
  }
})()
export async function pkgVersion(pkgName: string): Promise<string> {
  const data = (await json(pkgName)) as unknown as npmFetchData
  return (
    data['dist-tags'].latest ||
    Object.getOwnPropertyNames(data.versions)
      .sort(compareVersion)
      .slice(-1)[0] ||
    '0.0.0'
  )
}
export function isVaildVersion(version: string): boolean {
  const split = version.split("-");
  if (!split[0]) return false;
  if ((split[0] as string).split(".").map(Number).filter(i => !Number.isNaN(i)).length !== 3) return false
  return true;
}
export function runCommand(param: string[], cwd: string, stdio: "ignore" | "pipe"): Promise<string> {
  let resolve: (data: string) => void;
  let data = "";
  const promise = new Promise<string>((r) => resolve = r);
  const p = spawn(param[0] as string, param.slice(1), {
    cwd: cwd,
    shell: false,
    stdio: stdio,
    timeout: 1000 * 60 * 10
  })
  p.on("error", (err) => {
    resolve(data + "(code: error)")
  });
  p.on("data", (...args) => {
    data += args.join("");
  })
  p.on("exit", (code) => {
    if (!code) {
      resolve(`${data}(code: ${code})`);
    } else {
      resolve(data)
    }
  })
  return promise;
}
export async function fileExists(file: string) {
  try {
    await fs.stat(file)
    return true;
  } catch { return false }

}