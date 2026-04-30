import { argv } from 'node:process'
import { CliParam, cmdList } from '../types'
import i18n from '../i18n'
import Logger from './../logger/index'
import { showText } from '../utils'
import path from 'node:path'
import WorkDirManage from './WorkDirManage'
import { initCommand } from './init'
import { handlerVersion } from './version'
import { langCommand } from './lang'
import { unpublishCommand } from './unpublish'
import { publishCommand } from './publish'
import { uninstallCommand } from './uninstall'
import { installCommand } from './install'
import { loginCommand } from './login'
import { profileCommand } from './profile'
import { viewCommand } from './view'
import { configCommand } from './config'
// `showText` moved to `utils` to avoid circular dependency with `build`.
const main = (function (): () => Promise<void> {
  let currentWDManage: WorkDirManage

  function parseParam() {
    const opts: Record<string, string> = {}
    const params: string[] = []
    let InValue: string | null = null
    argv.slice(2).forEach((item, index, arr) => {
      if (InValue) {
        opts[InValue] = item
        InValue = null
        return
      }
      if (item.startsWith('-')) {
        InValue = item.slice(1)
        if (index == arr.length - 1) opts[InValue] = ''
      } else {
        params.push(item)
      }
    })
    return {
      params,
      opts,
    }
  }

  function handlerHelp(cliParam: CliParam, _: string): number {
    if (!cliParam || !_) return 1
    const seeCmd = cliParam.params[1] as string
    if (!seeCmd) {
      showText(i18n.description)
      return 0
    }
    let text = (i18n.help as any)[seeCmd] as string | undefined
    if (!text) return 0
    if (text.startsWith('$')) {
      text = (i18n.help as any)[text.slice(1)] as string
    }
    showText(text)
    return 0
  }

  function getMatchChance(a: string, b: string): number {
    let match = 0
    // b = 比较值，a = 待比较值
    for (let i = 0; i < b.length; i++) {
      if (a[i] == b[i]) match++
    }
    return match / b.length
  }
  async function handlerWorkDirCommand(
    cliParam: CliParam,
    workDir: string
  ): Promise<number> {
    if (!currentWDManage) return 0
    if (cliParam.params.length > 1) {
      const newPointWorkDir = path.resolve(cliParam.params[1] as string)
      showText(await currentWDManage.set(newPointWorkDir))
    } else {
      showText(workDir)
    }
    return 0
  }

  async function handlerSetWorkDirCommand(
    cliParam: CliParam,
    _: string
  ): Promise<number> {
    if (!currentWDManage) return 0
    const param = cliParam.params[1] as string | undefined
    if (param === 'off') {
      await currentWDManage.setDisabled(true)
      showText(i18n.workdir.disabled)
    } else if (param === 'on') {
      await currentWDManage.setDisabled(false)
      showText(i18n.workdir.enabled)
    } else {
      showText(i18n.workdir.invalidParam)
    }
    return 0
  }

  function defaultCommand(commandcc: string): void {
    console.log(`\x1b[31m${i18n.default.unexpected}: ${commandcc}\x1b[0m`)
    const didvalue = cmdList
      .map((item: string): number => getMatchChance(commandcc, item))
      .reduce(
        (
          acc: {
            max: number
            index: number
            indices: number[]
          },
          cur: number,
          index: number
        ): {
          max: number
          index: number
          indices: number[]
        } => {
          try {
            if (cur > acc.max) {
              return {
                max: cur,
                index: index,
                indices: [],
              } // 更新最大值及索引
            } else if (cur === acc.max) {
              acc.indices.push(index) // 记录重复最大值的索引
              return acc
            }
          } catch (err: any) {
            Logger.w('matchDefault', err.stack)
          }
          return acc
        },
        {
          max: -Infinity,
          index: -1,
          indices: [],
        }
      )
    const value = cmdList[didvalue.index]
    if (value) console.log(`${i18n.default.youis} ${value}`)
  }
  return async function cli(): Promise<void> {
    const cliParam = parseParam()
    const handlerBuild = async (
      cliParam: CliParam,
      workDir: string
    ): Promise<number> => {
      const { build } = typeof require == "function" ? require("mbler/build") : await import("mbler/build")
      return await build(cliParam, workDir)
    }

    const handlerWatch = async (
      cliParam: CliParam,
      workDir: string
    ): Promise<number> => {
      const { watch } = require("mbler/build")
      return await watch(cliParam, workDir)
    }

    const cmdMap: Record<
      typeof cmdList[number],
      | undefined
      | ((cliParam: CliParam, workDir: string) => number | Promise<number>)
    > = {
      help: handlerHelp,
      h: handlerHelp,
      work: handlerWorkDirCommand,
      c: handlerWorkDirCommand,
      build: handlerBuild,
      watch: handlerWatch,
      init: initCommand,
      version: handlerVersion,
      lang: langCommand,
      'set-work-dir': handlerSetWorkDirCommand,
      unpublish: unpublishCommand,
      publish: publishCommand,
      uninstall: uninstallCommand,
      install: installCommand,
      login: loginCommand,
      profile: profileCommand,
      view: viewCommand,
      config: configCommand
    }
    const cmd = cliParam.params[0]
    if (cliParam.opts.cwp) {
      currentWDManage = new WorkDirManage(
        path.resolve(cliParam.opts.cwp as string)
      )
    } else {
      currentWDManage = new WorkDirManage()
    }
    if (!cmd) {
      handlerHelp(cliParam, await currentWDManage.get())
      process.exit(0)
    }
    const handler = cmdMap[cmd as keyof typeof cmdMap]
    if (typeof handler !== 'function') {
      defaultCommand(cmd)
    } else {
      const r = handler(cliParam, await currentWDManage.get())
      if (r instanceof Promise) {
        const code = await r
        process.exit(code)
      } else {
        process.exit(r)
      }
    }
    process.exit(0)
  }
})()

export { main as cli }
