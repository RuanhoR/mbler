import i18n from '../i18n'
import { ConfigManager } from '../publisher/configManager'
import { showText } from '../utils'
import { defineCommand } from './command'

function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

function parseValue(raw: string): unknown {
  const v = raw.trim()
  if (/^-?\d+(?:\.\d+)?$/.test(v)) {
    const n = Number(v)
    if (!Number.isNaN(n)) return n
  }
  try {
    return JSON.parse(v)
  } catch {
    return raw
  }
}

function valueToString(value: unknown): string {
  if (value !== null && typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}

export const configCommand = defineCommand({
  name: 'config',
  aliases: [],
  description: i18n.help.config,
  args: [
    {
      name: 'subcommand',
      description: 'get, set, or point',
      required: true,
    },
    { name: 'key', description: 'Config key' },
    { name: 'value', variadic: true, description: 'Config value' },
  ],
  options: [],
  async handler(ctx) {
    const sub = ctx.args.subcommand
    try {
      if (sub === 'get') {
        const key = ctx.args.key
        if (!key) {
          showText(i18n.config.missingArg)
          return -1
        }
        const value = await ConfigManager.getKey<unknown>(key)
        showText(
          fmt(i18n.config.getResult, { key, value: valueToString(value) })
        )
        return 0
      }

      if (sub === 'set') {
        const key = ctx.args.key
        const raw = ctx.args.value ?? ''
        if (!key || raw.length < 1) {
          showText(i18n.config.missingArg)
          return -1
        }
        const value = parseValue(raw)
        const ok = await ConfigManager.setKey(key, value)
        if (!ok) {
          showText(fmt(i18n.config.failed, { error: 'write failed' }))
          return -1
        }
        showText(
          fmt(i18n.config.setSuccess, { key, value: valueToString(value) })
        )
        return 0
      }

      if (sub === 'point') {
        const next = ctx.args.key
        if (!next || next === 'get') {
          const point = await ConfigManager.getConfigPoint()
          showText(fmt(i18n.config.pointGet, { path: point }))
          return 0
        }
        try {
          await ConfigManager.setConfigPoint(next)
          showText(fmt(i18n.config.pointSetSuccess, { path: next }))
          return 0
        } catch (error) {
          showText(
            fmt(i18n.config.pointSetFailed, {
              error: error instanceof Error ? error.message : String(error),
            })
          )
          return -1
        }
      }

      showText(i18n.config.usage)
      return -1
    } catch (error) {
      showText(
        fmt(i18n.config.failed, {
          error: error instanceof Error ? error.message : String(error),
        })
      )
      return -1
    }
  },
})
