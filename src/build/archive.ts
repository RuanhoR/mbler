import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { write } from 'mcbe-brarchive-ts'
import type { MblerArchiveConfig } from '../types'

const BRARCHIVE_DIR = '__brarchive'

/**
 * Runs `fn` over `items` with at most `limit` tasks in flight. Order of the
 * results matches the input order; workers pull the next index as they finish.
 */
async function mapLimit<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let next = 0
  const workers: Promise<void>[] = []
  const count = Math.min(limit, items.length)
  for (let w = 0; w < count; w++) {
    workers.push(
      (async () => {
        while (next < items.length) {
          const i = next++
          results[i] = await fn(items[i]!, i)
        }
      })()
    )
  }
  await Promise.all(workers)
  return results
}

function globToRegExp(glob: string): RegExp {
  let re = ''
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i]!
    if (c === '*') {
      if (glob[i + 1] === '*') {
        i++
        re += '.*'
      } else {
        re += '[^/]*'
      }
    } else if (c === '?') {
      re += '[^/]'
    } else if (/[.*+?^${}()|[\]\\]/.test(c)) {
      re += '\\' + c
    } else {
      re += c
    }
  }
  return new RegExp(`^${re}$`)
}

/**
 * `**` also matches zero path segments, so `textures/**` excludes the
 * `textures` directory itself in addition to everything under it.
 */
function isExcluded(rel: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith('/**')) {
      const prefix = pattern.slice(0, -3)
      if (rel === prefix) return true
    }
    return globToRegExp(pattern).test(rel)
  })
}

interface DirEntry {
  dir: string
  rel: string
}

/**
 * Single recursive traversal returning every sub-directory of `root` (with its
 * immediate file names) that is not inside `__brarchive` and not excluded.
 * Directories that would be archived empty are dropped.
 */
async function collectDirs(
  root: string,
  exclude: string[]
): Promise<DirEntry[]> {
  const results: DirEntry[] = []

  async function visit(dir: string, rel: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    const files: string[] = []
    const dirs: string[] = []
    for (const entry of entries) {
      if (entry.isFile()) files.push(entry.name)
      else if (entry.isDirectory()) dirs.push(entry.name)
    }
    files.sort((a, b) => a.localeCompare(b))
    dirs.sort((a, b) => a.localeCompare(b))

    for (const name of dirs) {
      const childRel = rel ? `${rel}/${name}` : name
      if (childRel === BRARCHIVE_DIR || childRel.startsWith(`${BRARCHIVE_DIR}/`))
        continue
      if (isExcluded(childRel, exclude)) continue
      const childFiles = await visit(path.join(dir, name), childRel)
      if (childFiles.length > 0) {
        results.push({ dir: path.join(dir, name), rel: childRel })
      }
    }
    return files
  }

  await visit(root, '')
  return results
}

/**
 * Packs every (non-excluded) sub-directory of `outDir` into a `.brarchive` file
 * under `<outDir>/__brarchive/<relative path>.brarchive`. Directories are
 * processed concurrently, bounded by `options.concurrency`.
 */
export async function generateArchives(
  outDir: string,
  options: MblerArchiveConfig
): Promise<string[]> {
  const exclude = options.exclude ?? []
  const concurrency = Math.max(1, options.concurrency ?? 16)
  const dirs = await collectDirs(outDir, exclude)
  const written = await mapLimit(dirs, concurrency, async ({ dir, rel }) => {
    const outBase = path.join(outDir, BRARCHIVE_DIR, ...rel.split('/'))
    return write(dir, outBase)
  })
  return written.sort((a, b) => a.localeCompare(b))
}
