import { mkdir, stat, writeFile, readFile, rm } from 'node:fs/promises'
import { homedir } from 'node:os'
import i18n from './../i18n'
import path from 'node:path'
import { fileExists } from '../utils'
import Logger from '../logger'
import { cwd } from 'node:process'
async function tryMkdir(point: string): Promise<boolean> {
  try {
    await mkdir(point)
    return true
  } catch {
    return false
  }
}
export default class WorkDirManager {
  private currentWorkPoint: string | null = null
  private enabledPath = path.join(homedir(), '.cache/mbler/workdir_enabled.db')
  constructor(
    private cacheDir: string = path.join(homedir(), '.cache/mbler/mp.db')
  ) {}
  async isDisabled(): Promise<boolean> {
    try {
      await readFile(this.enabledPath, 'utf-8')
      return false
    } catch {
      return true
    }
  }
  async setDisabled(disabled: boolean): Promise<void> {
    if (!disabled) {
      await writeFile(this.enabledPath, '1', { encoding: 'utf-8' })
    } else {
      try {
        await rm(this.enabledPath)
      } catch {
        // ignore
      }
    }
  }
  async set(newPointDir: string): Promise<string> {
    // check
    try {
      const s = await stat(newPointDir)
      if (!s.isDirectory()) {
        throw new Error('Not Dir (0xcvb)')
      }
    } catch (err: unknown) {
      const nodeErr = err as { code?: string; message?: string }
      if (nodeErr.message?.includes('0xcvb')) return i18n.workdir.nfound
      if (nodeErr.code == 'ENOENT') {
        const res = await tryMkdir(newPointDir)
        if (!res) {
          return i18n.workdir.nfound
        }
      }
    }
    try {
      if (!(await fileExists(path.dirname(this.cacheDir)))) {
        const isC = await tryMkdir(path.dirname(this.cacheDir))
        if (!isC) return i18n.workdir.nfound
      }
      await writeFile(this.cacheDir, newPointDir, {
        encoding: 'utf-8',
      })
    } catch (err: unknown) {
      Logger.e(
        'WorkDir',
        err instanceof Error
          ? (err.stack ?? err.message ?? String(err))
          : String(err)
      )
    }
    return i18n.workdir.set + newPointDir
  }
  async get() {
    if (await this.isDisabled()) {
      return cwd()
    }
    if (this.currentWorkPoint) {
      return this.currentWorkPoint
    }
    const file = await readFile(this.cacheDir, 'utf-8').catch(async (_e) => {
      await this.set(cwd())
      return cwd()
    })
    return (this.currentWorkPoint = file)
  }
}
