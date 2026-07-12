import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { createHash } from 'node:crypto'
import { fileExists } from '../utils'

export type BuildCacheMode = 'none' | 'memory' | 'file' | 'filesystem' | 'auto'
type EffectiveCacheMode = 'none' | 'memory' | 'file'

interface CacheEntry {
  hash: string
  mtime: number
}

export class BuildCacheManager {
  private readonly mode: EffectiveCacheMode
  private readonly projectRoot: string
  private readonly cachePath: string
  private memoryCache: Map<string, CacheEntry> = new Map()
  private cacheDirty = false
  private loaded = false

  constructor(
    projectRoot: string,
    mode: BuildCacheMode | undefined,
    cachePath?: string
  ) {
    this.projectRoot = projectRoot
    this.cachePath = cachePath || path.join(projectRoot, 'node_modules', '.mbler-cache.json')
    this.mode = this.resolveMode(mode ?? 'auto')
  }

  public getMode() {
    return this.mode
  }

  public shouldUseIncrementalBuild(): boolean {
    return this.mode !== 'none'
  }

  public async isCacheValid(filePaths: string[]): Promise<boolean> {
    if (this.mode === 'none') return false
    await this.ensureLoaded()
    for (const fp of filePaths) {
      const entry = this.memoryCache.get(fp)
      if (!entry) return false
      try {
        const stat = await fs.stat(fp)
        const mtime = stat.mtimeMs
        if (mtime > entry.mtime) return false
        const hash = await this.computeFileHash(fp)
        if (hash !== entry.hash) return false
      } catch {
        return false
      }
    }
    return true
  }

  public async updateCache(filePaths: string[]): Promise<void> {
    if (this.mode === 'none') return
    await this.ensureLoaded()
    for (const fp of filePaths) {
      try {
        const stat = await fs.stat(fp)
        const hash = await this.computeFileHash(fp)
        this.memoryCache.set(fp, { hash, mtime: stat.mtimeMs })
        this.cacheDirty = true
      } catch {
        // if file no longer exists, remove from cache
        this.memoryCache.delete(fp)
        this.cacheDirty = true
      }
    }
    if (this.cacheDirty) {
      await this.persist()
    }
  }

  public async invalidate(filePaths?: string[]): Promise<void> {
    if (this.mode === 'none') return
    await this.ensureLoaded()
    if (filePaths) {
      for (const fp of filePaths) {
        this.memoryCache.delete(fp)
      }
    } else {
      this.memoryCache.clear()
    }
    this.cacheDirty = true
    await this.persist()
  }

  private async computeFileHash(filePath: string): Promise<string> {
    const content = await fs.readFile(filePath)
    return createHash('sha256').update(content).digest('hex').slice(0, 16)
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    if (this.mode === 'file') {
      try {
        if (await fileExists(this.cachePath)) {
          const raw = await fs.readFile(this.cachePath, 'utf-8')
          const data = JSON.parse(raw) as Record<string, { hash: string; mtime: number }>
          for (const [key, val] of Object.entries(data)) {
            this.memoryCache.set(key, val)
          }
        }
      } catch {
        // corrupted cache, start fresh
        this.memoryCache.clear()
      }
    }
    this.loaded = true
  }

  private async persist(): Promise<void> {
    if (!this.cacheDirty) return
    this.cacheDirty = false
    if (this.mode === 'memory') {
      // no-op for in-memory cache
      return
    }
    try {
      const obj: Record<string, CacheEntry> = {}
      for (const [key, val] of this.memoryCache.entries()) {
        obj[key] = val
      }
      const dir = path.dirname(this.cachePath)
      if (!(await fileExists(dir))) {
        await fs.mkdir(dir, { recursive: true })
      }
      await fs.writeFile(this.cachePath, JSON.stringify(obj, null, 2), 'utf-8')
    } catch {
      // persist failure is non-fatal
    }
  }

  private resolveMode(mode: BuildCacheMode | undefined): EffectiveCacheMode {
    if (mode === 'none') return 'none'
    if (mode === 'memory') return 'memory'
    if (mode === 'file' || mode === 'filesystem') return 'file'
    return 'file'
  }
}
