import path from 'node:path'
import {
  fileExists,
  readFileAsJson,
  showText,
  ReadProjectMblerConfig,
  writeJSON,
} from '../utils'
import sapi from '../build/sapi'
import { defineCommand } from './command'

interface PkgDeps {
  [key: string]: string
}

interface PkgJson {
  dependencies?: PkgDeps
  devDependencies?: PkgDeps
  [key: string]: unknown
}

/**
 * Convert a beta SAPI version (e.g. "2.10.0-beta") to its stable equivalent
 * by decrementing the patch version. This is needed because when developing
 * against beta APIs, the matching stable release doesn't exist yet — the
 * last stable below it should be used instead.
 *
 * Example: 2.10.0-beta → strip prerelease → 2.10.0 → decrement → 2.9.0
 */
function betaToStable(version: string): string {
  const base = version.split('-')[0] ?? version
  const parts = base.split('.')
  const patch = parseInt(parts[parts.length - 1] ?? '0', 10)
  if (isNaN(patch) || patch <= 0) return base
  parts[parts.length - 1] = String(patch - 1)
  return parts.join('.')
}

export const syncMcDepCommand = defineCommand({
  name: 'sync-mc-dep',
  aliases: ['smd'],
  description:
    'sync-mc-dep\n- Detects mcVersion from mbler.config.js and writes matching @minecraft/server + @minecraft/server-ui versions into package.json',
  args: [],
  options: [
    {
      name: 'beta',
      alias: 'b',
      description: 'Force beta mode (overrides mbler.config.js UseBeta)',
    },
    {
      name: 'full',
      alias: 'f',
      description: 'Write full SAPI version strings including prerelease tags',
    },
  ],
  async handler(ctx) {
    const configPath = path.join(ctx.workDir, 'mbler.config.js')
    if (!(await fileExists(configPath))) {
      showText('[sync-mc-dep]: mbler.config.js not found in current directory')
      return 1
    }

    let config: Record<string, unknown>
    try {
      config = await ReadProjectMblerConfig(ctx.workDir) as unknown as Record<string, unknown>
    } catch {
      showText('[sync-mc-dep]: failed to load mbler.config.js')
      return 1
    }

    const mcVersion = config.mcVersion as string | undefined
    if (!mcVersion) {
      showText('[sync-mc-dep]: mbler.config.js is missing "mcVersion"')
      return 1
    }

    const script = config.script as
      | { UseBeta?: boolean; lang?: string }
      | undefined
    const useBeta =
      (ctx.opts.beta !== undefined && ctx.opts.beta !== 'false') ||
      script?.UseBeta === true

    const withFull = ctx.opts.full !== undefined && ctx.opts.full !== 'false'

    showText(
      `[sync-mc-dep]: mcVersion=${mcVersion} useBeta=${useBeta} withFull=${withFull}`
    )

    const pkgPath = path.join(ctx.workDir, 'package.json')
    if (!(await fileExists(pkgPath))) {
      showText('[sync-mc-dep]: package.json not found')
      return 1
    }
    const pkg = await readFileAsJson<PkgJson>(pkgPath)

    const modules = ['@minecraft/server', '@minecraft/server-ui'] as const
    let changed = false

    for (const moduleName of modules) {
      const full = await sapi.generateVersion(
        moduleName,
        mcVersion,
        useBeta,
        true
      )
      if (!full || full === 'error') {
        showText(`[sync-mc-dep]: no SAPI version found for ${moduleName}`)
        continue
      }

      let depVersion: string
      if (withFull) {
        depVersion = full
      } else if (useBeta && full.includes('-')) {
        // Beta → convert to closest stable by decrementing patch
        depVersion = betaToStable(full)
      } else {
        depVersion = full.split('-')[0] ?? full
      }

      if (!pkg.dependencies) pkg.dependencies = {}
      const old = pkg.dependencies[moduleName]
      if (old !== depVersion) {
        pkg.dependencies[moduleName] = depVersion
        changed = true
        showText(
          `[sync-mc-dep]: ${moduleName}: ${old ?? '(not set)'} → ${depVersion}`
        )
      } else {
        showText(`[sync-mc-dep]: ${moduleName}: ${depVersion} (unchanged)`)
      }
    }

    if (!changed) {
      showText('[sync-mc-dep]: all dependencies are up to date')
      return 0
    }

    await writeJSON(pkgPath, pkg)
    showText('[sync-mc-dep]: package.json updated ✓ run pnpm install to apply')

    return 0
  },
})
