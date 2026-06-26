import { argv } from 'node:process'
import { cmdList } from '../types'
import i18n from '../i18n'
import Logger from '../logger'
import { ReadProjectMblerConfig, showText } from '../utils'
import path from 'node:path'
import WorkDirManager from './WorkDirManager'
import { CommandDef, parseArgs, parseRawParams } from './command'
import { configCommand } from './config'
import { initCommand } from './init'
import { versionCommand } from './version'
import { langCommand } from './lang'
import { unpublishCommand } from './unpublish'
import { publishCommand } from './publish'
import { uninstallCommand } from './uninstall'
import { installCommand } from './install'
import { loginCommand } from './login'
import { profileCommand } from './profile'
import { viewCommand } from './view'

function getMatchChance(a: string, b: string): number {
  let match = 0
  for (let i = 0; i < b.length; i++) {
    if (a[i] == b[i]) match++
  }
  return match / b.length
}

function defaultCommand(commandcc: string): void {
  console.log(`\x1b[31m${i18n.default.unexpected}: ${commandcc}\x1b[0m`)
  const didvalue = cmdList
    .map((item: string): number => getMatchChance(commandcc, item))
    .reduce(
      (
        acc: { max: number; index: number; indices: number[] },
        cur: number,
        index: number
      ): { max: number; index: number; indices: number[] } => {
        if (cur > acc.max) {
          return { max: cur, index: index, indices: [] }
        } else if (cur === acc.max) {
          acc.indices.push(index)
          return acc
        }
        return acc
      },
      { max: -Infinity, index: -1, indices: [] }
    )
  const value = cmdList[didvalue.index]
  if (value) console.log(`${i18n.default.youis} ${value}`)
}

const main = (function () {
  let currentWDManager: WorkDirManager

  const importBuild = async () => {
    const { build } =
      typeof require == 'function'
        ? require('mbler/build')
        : await import('mbler/build')
    return build as (typeof import('mbler/build'))['build']
  }

  const importWatch = async () => {
    const { watch } =
      typeof require == 'function'
        ? require('mbler/build')
        : await import('mbler/build')
    return watch
  }

  const allCommands: CommandDef[] = [
    {
      name: 'help',
      aliases: ['h'],
      description: i18n.description,
      args: [{ name: 'command', description: 'Command name to view help for' }],
      options: [],
      handler(ctx) {
        const seeCmd = ctx.args.command
        if (!seeCmd) {
          showText(i18n.description)
          return 0
        }
        let text = i18n.help[seeCmd as (typeof cmdList)[number]] as
          | string
          | undefined
        if (!text) return 0
        if (text.startsWith('$')) {
          text = i18n.help[text.slice(1) as (typeof cmdList)[number]] as string
        }
        showText(text)
        return 0
      },
    },
    {
      name: 'work',
      aliases: ['c'],
      description: i18n.help.work,
      args: [{ name: 'path', description: 'Working directory path' }],
      options: [],
      async handler(ctx) {
        if (!currentWDManager) return 0
        if (ctx.args.path) {
          showText(await currentWDManager.set(path.resolve(ctx.args.path)))
        } else {
          showText(ctx.workDir)
        }
        return 0
      },
    },
    {
      name: 'set-work-dir',
      aliases: [],
      description: i18n.help['set-work-dir'],
      args: [
        {
          name: 'mode',
          description: 'on or off',
          required: true,
        },
      ],
      options: [],
      async handler(ctx) {
        if (!currentWDManager) return 0
        const param = ctx.args.mode
        if (param === 'off') {
          await currentWDManager.setDisabled(true)
          showText(i18n.workdir.disabled)
        } else if (param === 'on') {
          await currentWDManager.setDisabled(false)
          showText(i18n.workdir.enabled)
        } else {
          showText(i18n.workdir.invalidParam)
        }
        return 0
      },
    },
    {
      name: 'log',
      aliases: [],
      description: i18n.help.log,
      args: [
        {
          name: 'action',
          description: 'point or clean',
          required: true,
        },
      ],
      options: [],
      async handler(ctx) {
        const { rm } = await import('node:fs/promises')
        if (ctx.args.action === 'point') {
          showText(Logger.LogFile)
        } else if (ctx.args.action === 'clean') {
          await rm(Logger.LogFile, { recursive: true, force: true })
        } else {
          showText('Unknown log Command')
        }
        return 0
      },
    },
    {
      name: 'build',
      aliases: [],
      description: i18n.help.build,
      args: [],
      options: [],
      async handler(ctx) {
        const isDebug = process.env.DEBUG == 'true'
        if (isDebug) {
          const Module = require('module')
          const originalRequire = Module.prototype.require
          Module.prototype.require = function (id: string) {
            const isCached = !!Module._cache[id]
            const start = performance.now()
            const result = originalRequire.call(this, id)
            const duration = performance.now() - start

            const status = isCached ? '[CACHED]' : '[FIRST]'
            if (duration > 5) {
              console.log(
                `[mbler Module load DEBUG]: ${status} [${duration.toFixed(2)}ms] ${id}`
              )
            }

            return result
          }
        }
        const startTime = performance.now()
        const result = await Promise.all([
          importBuild().then((r) => {
            if (isDebug)
              console.debug(
                `[mbler DEBUG]: import builder usage: ${performance.now() - startTime}ms`
              )
            return r
          }),
          ReadProjectMblerConfig(ctx.workDir).then((r) => {
            // perf: preload @mbler/mcx-core
            if (r.script?.lang == 'mcx') {
              import('@mbler/mcx-core')
            }
            if (isDebug)
              console.debug(
                `[mbler DEBUG]: load config usage time: ${performance.now() - startTime}ms`
              )
            return r
          }),
        ])
        const builder = result[0]
        return builder(result[1], ctx.workDir)
      },
    },
    {
      name: 'watch',
      aliases: [],
      description: i18n.help.watch,
      args: [],
      options: [],
      async handler(ctx) {
        const watch = await importWatch()
        return watch({ params: [], opts: ctx.opts }, ctx.workDir) as number
      },
    },
    initCommand,
    versionCommand,
    langCommand,
    publishCommand,
    unpublishCommand,
    installCommand,
    uninstallCommand,
    loginCommand,
    profileCommand,
    viewCommand,
    configCommand,
  ]

  const cmdMap: Record<string, CommandDef> = {}
  for (const cmd of allCommands) {
    cmdMap[cmd.name] = cmd
    for (const alias of cmd.aliases) {
      cmdMap[alias] = cmd
    }
  }

  return async function cli(): Promise<void> {
    const raw = parseRawParams(argv.slice(2))
    const cmdName = raw.params[0] || ''

    if (raw.opts.cwp) {
      currentWDManager = new WorkDirManager(path.resolve(raw.opts.cwp))
    } else {
      currentWDManager = new WorkDirManager()
    }

    const workDir = await currentWDManager.get()

    if (!cmdName) {
      showText(i18n.description)
      process.exit(0)
    }

    const def = cmdMap[cmdName]
    if (typeof def !== 'object') {
      defaultCommand(cmdName)
      process.exit(1)
    }

    const args = parseArgs(def, raw.params.slice(1))
    const code = await def.handler({ args, opts: raw.opts, workDir })
    process.exit(code)
  }
})()

export { main as cli }
