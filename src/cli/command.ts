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
      const eqIdx = item.indexOf('=')
      if (eqIdx !== -1) {
        const key = item.slice(1, eqIdx)
        opts[key] = item.slice(eqIdx + 1)
      } else {
        const key = item.slice(1)
        if (i + 1 < raw.length && !raw[i + 1]!.startsWith('-')) {
          i++
          opts[key] = raw[i]!
        } else {
          opts[key] = ''
        }
      }
    } else {
      params.push(item)
    }
    i++
  }
  return { params, opts }
}
