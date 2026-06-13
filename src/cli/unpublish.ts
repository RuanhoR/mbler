import i18n from '../i18n'
import { showText } from '../utils'
import { PublishManger } from '../publisher/publishManger'
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

export const unpublishCommand = defineCommand({
  name: 'unpublish',
  aliases: [],
  description: i18n.help.unpublish,
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
      showText(i18n.help.unpublish)
      return -1
    }

    try {
      await PublishManger.unpublish(parsed.scope, parsed.name, parsed.version)
      showText(
        fmt(i18n.unpublish.success, {
          pkg: `${parsed.scope}/${parsed.name}`,
          version: parsed.version,
        })
      )
      return 0
    } catch (error) {
      showText(
        fmt(i18n.unpublish.failed, {
          error: error instanceof Error ? error.message : String(error),
        })
      )
      return -1
    }
  },
})
