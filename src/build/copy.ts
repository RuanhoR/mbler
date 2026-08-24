import * as fs from 'node:fs/promises'
import path from 'node:path'
import { BuildConfig } from './config'

/**
 * Determine whether a path refers to a regular file or a directory.
 * Follows symbolic links recursively.  Throws if the path exists but
 * is not one of the expected types.
 */
export async function fileType(
  filePath: string
): Promise<'file' | 'directory'> {
  const stat = await fs.lstat(filePath)
  if (stat.isFile()) {
    return 'file'
  }
  if (stat.isDirectory()) {
    return 'directory'
  }
  if (stat.isSymbolicLink()) {
    return await fileType(await fs.readlink(filePath))
  }
  throw new Error('[build addon]: invalid file type')
}

/**
 * Copy for watch-mode incremental updates: skips silently when the source
 * vanished between the fs event and the copy (delete/rename races), and
 * makes sure the destination parent directory exists.
 */
export async function safeCopy(src: string, dest: string): Promise<void> {
  try {
    await fs.stat(src)
    await fs.mkdir(path.dirname(dest), { recursive: true })
    await fs.cp(src, dest, { recursive: true, force: true })
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e
  }
}

/**
 * Copy the top-level entries of `srcDir` into `destDir`, honouring the
 * include maps from {@link BuildConfig}.  Entries whose type does not match
 * their configured include kind abort the build with an error.
 */
export async function copyIncludedEntries(
  srcDir: string,
  destDir: string,
  moduleType: 'behavior' | 'resources'
): Promise<void> {
  const includes = BuildConfig.includes[moduleType]
  for (const f of await fs.readdir(srcDir)) {
    const fType = await fileType(path.join(srcDir, f))
    const includeType = includes[f] || BuildConfig.includes.public[f]
    if (includeType == fType) {
      await fs.cp(path.join(srcDir, f), path.join(destDir, f), {
        recursive: true,
        force: true
      })
    } else if (includeType == 'skip') {
      continue
    } else {
      throw new Error(
        `[build addon]: invalid file: ${path.join(srcDir, f)}: type: ${fType}`
      )
    }
  }
}

/**
 * If a texts/ directory contains .lang files but no languages.json,
 * generate one from the available .lang filenames.  Minecraft Bedrock
 * requires this file to activate localization — without it all .lang
 * entries are silently ignored and raw keys are displayed.
 */
export async function ensureLanguagesJson(destDir: string): Promise<void> {
  const textsDir = path.join(destDir, 'texts');
  try {
    const files = await fs.readdir(textsDir);
    const langFiles = files.filter(f => f.endsWith('.lang'));
    if (langFiles.length === 0) return;
    const langJsonPath = path.join(textsDir, 'languages.json');
    try {
      await fs.access(langJsonPath);
      return; // already exists
    } catch {}
    const langs = langFiles.map(f => f.replace(/.lang$/, '')).sort();
    await fs.writeFile(langJsonPath, JSON.stringify(langs), 'utf-8');
  } catch {
    // texts dir doesn't exist or can't be read — nothing to do
  }
}
