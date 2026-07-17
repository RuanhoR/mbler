import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { MblerBuildConfig, MblerConfigData, MblerConfigOutdir, templateMblerConfig } from '../types'
import { Input } from '../commander'
import { spawn } from 'node:child_process'
import { BuildConfig } from '../build/config'
import Logger from '../logger'
import { pathToFileURL } from 'node:url'
export function join(baseDir: string, inputPath: string): string {
  return path.isAbsolute(inputPath) ? inputPath : path.join(baseDir, inputPath)
}
const requiredConfigKeys: (keyof MblerConfigData)[] = [
  'description',
  'mcVersion',
]

export async function ReadProjectMblerConfig(
  project: string
): Promise<MblerConfigData> {
  const configPath = path.resolve(project, BuildConfig.ConfigFile)
  const fileExport = await import(String(pathToFileURL(configPath)))
  const file = (fileExport as { default: MblerConfigData }).default || {}
  for (const key in file) {
    if (!(key in templateMblerConfig)) {
      throw new Error(
        `[read config]: read config from '${project}' error: Unexpected '${key}'`
      )
    }
  }
  for (const key of requiredConfigKeys) {
    if (!(key in file) || file[key] === undefined || file[key] === '') {
      throw new Error(
        `[read config]: '${key}' is required in ${BuildConfig.ConfigFile}`
      )
    }
  }
  const config: MblerConfigData = {
    ...templateMblerConfig,
    ...file,
    outdir: { ...templateMblerConfig.outdir, ...file.outdir } as MblerConfigOutdir,
    build: { ...templateMblerConfig.build, ...file.build } as Partial<MblerBuildConfig>,
  }
  try {
    const pkgRaw = await fs.readFile(
      path.join(project, 'package.json'),
      'utf-8'
    )
    const pkg = JSON.parse(pkgRaw)
    if (pkg.name) config.name = pkg.name
    if (pkg.version) config.version = pkg.version
  } catch {
    // fallback to template defaults
  }
  if (!config.name) config.name = 'unknown'
  if (!config.version) config.version = '0.0.0'
  return config
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
      throw new Error(err as string, { cause: err })
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
process.on('exit', flushOutputQueue)
export function showText(text: string, needNextLine: boolean = true) {
  outputQueue.push(text + (needNextLine ? '\n' : ''))
  if (!isFlushing) {
    Promise.resolve()
      .then(() => flushOutputQueue())
      .catch(() => {
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
export async function writeJSON(
  filePath: string,
  data: unknown
): Promise<void> {
  const content = JSON.stringify(data, null, 2)
  if (!(await fileExists(path.dirname(filePath)))) {
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
    if (ctrl && (raw === 'return' || raw === 'enter')) {
      curr(currstr)
      curr = null
      currstr = ''
      console.log('\n')
      return
    }
    if (ctrl || alt) return
    if (raw) {
      if (raw === 'return' || raw === 'enter') {
        currstr += '\n'
        refreshInput()
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
    const lines = currstr.split('\n')
    const lineCount = lines.length
    if (lineCount > 1) {
      process.stdout.write(`\x1b[${lineCount - 1}A`)
    }
    for (let i = 0; i < lineCount; i++) {
      process.stdout.write(`\x1b[2K\r`)
      if (i === 0) {
        process.stdout.write(tip)
      }
      if (show) {
        process.stdout.write(lines[i] || '')
      }
      if (i < lineCount - 1) {
        process.stdout.write('\n')
      }
    }
  }
  /**
   * 输入文本
   * @param{string} tip 提示
   * @param{boolean} show 是否显示输入
   */
  return async function (t: string = '', g: boolean = true): Promise<string> {
    return new Promise((resolve) => {
      flushOutputQueue().then(() => {
        show = g
        tip = t
        refreshInput()
        curr = resolve
      })
    })
  }
})()
export function isValidVersion(version: string): boolean {
  const split = version.split('-')
  if (!split[0]) return false
  if (
    (split[0] as string)
      .split('.')
      .map(Number)
      .filter((i) => !Number.isNaN(i)).length !== 3
  )
    return false
  return true
}
export function runCommand(
  param: string[],
  cwd: string,
  stdio: 'ignore' | 'pipe' | 'inherit'
): Promise<{ code: number | null; data: string }> {
  let resolve: (result: { code: number | null; data: string }) => void
  let data = ''
  const promise = new Promise<{ code: number | null; data: string }>(
    (r) =>
    (resolve = (...argv) => {
      Logger.i(
        'Utils: runCommand',
        `run command: '${param.join(' ')}' return: ${JSON.stringify(argv[0])}`
      )
      r(...argv)
    })
  )
  const p = spawn(param[0] as string, param.slice(1), {
    cwd: cwd,
    shell: process.platform === 'win32',
    stdio: stdio,
    timeout: 1000 * 60 * 10,
  })
  if (p.stdout) {
    p.stdout.on('data', (chunk: Buffer) => {
      data += chunk.toString()
    })
  }
  p.on('error', (_err) => {
    resolve({ code: -1, data })
  })
  p.on('close', (code) => {
    resolve({ code, data })
  })
  return promise
}
export async function fileExists(file: string) {
  try {
    await fs.stat(file)
    return true
  } catch {
    return false
  }
}
const README_CANDIDATES = [
  'README.md',
  'readme.md',
  'Readme.md',
  'README.MD',
  'readme.MD',
  'Readme.MD',
  'README.markdown',
  'readme.markdown',
  'Readme.markdown',
  'README',
]
export async function findReadme(dir: string): Promise<string | null> {
  for (const name of README_CANDIDATES) {
    const full = path.join(dir, name)
    if (await fileExists(full)) return full
  }
  return null
}
