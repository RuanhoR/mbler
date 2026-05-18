import fs from "node:fs/promises"
import path from "node:path"
import { deserialize, serialize } from "node:v8"
import type { RollupCache } from "rollup"
import Logger from "../logger"

export type BuildCacheMode = "none" | "memory" | "file" | "filesystem" | "auto"
type EffectiveCacheMode = "none" | "memory" | "file"

export class BuildCacheManager {
  private readonly cacheDir: string
  private readonly cacheFile: string
  private readonly mode: EffectiveCacheMode
  private memoryCache: RollupCache | undefined

  constructor(
    private readonly projectRoot: string,
    mode: BuildCacheMode | undefined,
    private readonly isWatch: boolean,
    cachePath?: string
  ) {
    const cacheFile = cachePath
      ? cachePath
      : path.join(this.projectRoot, 'mbler', 'rolldown.bin')
    const cacheDir = path.dirname(cacheFile)
    this.cacheDir = cacheDir
    this.cacheFile = cacheFile
    this.mode = this.resolveMode(mode)
  }

  public getMode() {
    return this.mode
  }

  public async getRollupCache(): Promise<RollupCache | undefined> {
    if (this.mode === "none") return undefined
    if (this.mode === "memory") return this.memoryCache
    if (this.memoryCache) return this.memoryCache
    try {
      const raw = await fs.readFile(this.cacheFile)
      this.memoryCache = deserialize(raw) as RollupCache
      return this.memoryCache
    } catch {
      return undefined
    }
  }

  public getWatchCacheOption() {
    if (this.mode === "none") return false
    return true
  }

  public async saveRollupCache(cache: RollupCache | undefined) {
    if (!cache || this.mode === "none") return
    this.memoryCache = cache
    if (this.mode !== "file") return
    try {
      await fs.mkdir(this.cacheDir, { recursive: true })
      await fs.writeFile(this.cacheFile, serialize(cache))
    } catch (error) {
      Logger.w("BuildCache", `failed to write file cache: ${error}`)
    }
  }

  private resolveMode(mode: BuildCacheMode | undefined): EffectiveCacheMode {
    const value = mode ?? "auto"
    if (value === "none") return "none"
    if (value === "memory") return "memory"
    // "file", "filesystem", or "auto" — all default to file
    return "file"
  }
}
