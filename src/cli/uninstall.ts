import path from 'node:path'
import fs from 'node:fs/promises'
import i18n from '../i18n'
import { showText } from '../utils'
import { GamePath } from '../publisher/GamePath'
import { ConfigManger } from '../publisher/configManger'
import { defineCommand } from './command'

function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

function parsePackage(
  pkg: string
): { scope: string; name: string; version: string } | null {
  const result = /^(@[^/@\s]+)\/([^@\s]+)@(.+)$/.exec(pkg)
  if (!result) return null
  return {
    scope: result[1]!,
    name: result[2]!,
    version: result[3]!,
  }
}

export const uninstallCommand = defineCommand({
  name: 'uninstall',
  aliases: [],
  description: i18n.help.uninstall,
  args: [
    {
      name: 'package',
      description: '@scope/name@version',
      required: true,
    },
  ],
  options: [],
  async handler(ctx) {
    const pkg = ctx.args.package!
    const parsed = parsePackage(pkg)
    if (!parsed) {
      showText(i18n.help.uninstall)
      return -1
    }

    const gamePoint = await GamePath.getPathWithASK()
    if (!gamePoint) {
      showText(i18n.help.uninstall)
      return -1
    }

    try {
      const id = `${parsed.scope.slice(1)}-${parsed.name}-${parsed.version}`
      const behaviorDir = path.join(gamePoint, 'behavior_packs', id)
      const resourceDir = path.join(gamePoint, 'resource_packs', id)

      await fs.rm(behaviorDir, { recursive: true, force: true })
      await fs.rm(resourceDir, { recursive: true, force: true })

      const installed =
        (await ConfigManger.getKey<Array<{ id: string }>>(
          'installedPackages'
        )) || []
      const filtered = installed.filter((pkg) => pkg.id !== id)
      await ConfigManger.setKey('installedPackages', filtered)

      showText(
        fmt(i18n.uninstall.success, {
          pkg: `${parsed.scope}/${parsed.name}`,
          version: parsed.version,
        })
      )
      return 0
    } catch (error) {
      showText(
        fmt(i18n.uninstall.failed, {
          error: error instanceof Error ? error.message : String(error),
        })
      )
      return -1
    }
  },
})
