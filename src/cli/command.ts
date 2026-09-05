export interface CommandArg {
  name: string
  description: string
  required?: boolean
  variadic?: boolean
}

export interface CommandOption {
  name: string
  alias?: string
  description: string
  default?: string
}

export interface CommandHandlerContext {
  args: Record<string, string | undefined>
  opts: Record<string, string>
  workDir: string
}

export interface CommandDef {
  name: string
  aliases: readonly string[]
  description: string
  args: readonly CommandArg[]
  options: readonly CommandOption[]
  handler: (ctx: CommandHandlerContext) => number | Promise<number>
}

export function defineCommand(def: CommandDef): CommandDef {
  return def
}

export function parseArgs(
  def: CommandDef,
  params: string[]
): Record<string, string | undefined> {
  const args: Record<string, string | undefined> = {}
  let pos = 0
  for (const argDef of def.args) {
    if (argDef.variadic) {
      args[argDef.name] = params.slice(pos).join(' ') || undefined
      pos = params.length
    } else {
      args[argDef.name] = params[pos]
      pos++
    }
  }
  for (const argDef of def.args) {
    if (argDef.required) {
      const val = args[argDef.name]
      if (val === undefined || val === '') {
        throw new Error(`Missing required argument: ${argDef.name}`)
      }
    }
  }
  return args
}

export function parseRawParams(
  raw: string[]
): { params: string[]; opts: Record<string, string> } {
  const params: string[] = []
  const opts: Record<string, string> = {}
  let i = 0
  while (i < raw.length) {
    const item = raw[i]!
    if (item.startsWith('-')) {
      const stripped = item.replace(/^-+/, '')
      const eqIdx = stripped.indexOf('=')
      if (eqIdx !== -1) {
        const key = stripped.slice(0, eqIdx)
        opts[key] = stripped.slice(eqIdx + 1)
      } else {
        if (i + 1 < raw.length && !raw[i + 1]!.startsWith('-')) {
          i++
          opts[stripped] = raw[i]!
        } else {
          opts[stripped] = ''
        }
      }
    } else {
      params.push(item)
    }
    i++
  }
  return { params, opts }
}

/** Map declared option aliases (e.g. `-f`) to their long names (e.g. `full`). */
export function resolveOptionAliases(
  def: CommandDef,
  opts: Record<string, string>
): Record<string, string> {
  const resolved: Record<string, string> = { ...opts }
  for (const opt of def.options) {
    if (opt.alias !== undefined && opt.alias in opts) {
      resolved[opt.name] = opts[opt.name] ?? opts[opt.alias]!
    }
  }
  return resolved
}
