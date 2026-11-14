import fs from 'node:fs/promises'
import path from 'node:path'
import type {
  MblerConfigData,
  MblerMcxCompletionContribution,
  MblerMcxPlugin,
} from '../types'

/** Workspace-relative path read by the MCX language server. */
export const MCX_COMPLETION_MANIFEST = '.mbler/mcx-completion.json'

function flattenPlugins(
  value: MblerConfigData['mcxPlugin']
): MblerMcxPlugin[] {
  const out: MblerMcxPlugin[] = []
  const walk = (item: unknown): void => {
    if (Array.isArray(item)) {
      for (const child of item) walk(child)
      return
    }
    if (typeof item === 'function') {
      try {
        walk((item as () => unknown)())
      } catch {
        // A factory that throws is the compiler's problem, not the editor's.
      }
      return
    }
    if (item && typeof item === 'object') out.push(item as MblerMcxPlugin)
  }
  walk(value)
  return out
}

/**
 * Completion contributions declared by the configured compiler plugins.
 * Only `mcx` projects have a template, so other languages contribute nothing.
 */
export function collectCompletionContributions(
  config: MblerConfigData
): MblerMcxCompletionContribution[] {
  if (config.script?.lang !== 'mcx') return []
  return flattenPlugins(config.mcxPlugin)
    .map(plugin => plugin.completion)
    .filter(
      (item): item is MblerMcxCompletionContribution =>
        Boolean(item && typeof item.name === 'string' && item.name.length > 0)
    )
}

/**
 * Write `.mbler/mcx-completion.json` so the language server offers the tags and
 * attributes contributed by plugins. When no plugin contributes anything the
 * file is removed, so removing a plugin also removes its completions.
 */
export async function writeCompletionManifest(
  config: MblerConfigData,
  baseBuildDir: string
): Promise<string | undefined> {
  const contributions = collectCompletionContributions(config)
  const file = path.join(baseBuildDir, MCX_COMPLETION_MANIFEST)
  if (contributions.length === 0) {
    await fs.rm(file, { force: true })
    return undefined
  }
  const manifest = {
    version: 1 as const,
    project: baseBuildDir,
    contributions,
  }
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')
  return file
}
