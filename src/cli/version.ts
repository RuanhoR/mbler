import * as path from 'node:path'
import { MblerConfigData } from '../types'
import { fileExists, isValidVersion, readFileAsJson, showText } from '../utils'
import MBLERVersion from '../version'
import { BuildConfig } from '../build/config'
import { defineCommand } from './command'

function showVersion(ctx: { opts: Record<string, string> }) {
  let show = ''
  if (Object.keys(ctx.opts).length < 1) {
    show = `commit: ${MBLERVersion.commit}\nversion: ${MBLERVersion.version}`
  } else if (ctx.opts.show) {
    if (ctx.opts.show == 'commit') {
      show = `commit: ${MBLERVersion.commit}`
    } else if (ctx.opts.show == 'version') {
      show = `version: ${MBLERVersion.version}`
    } else {
      show = 'invalid "show" param'
    }
  }
  showText(show)
}

export const versionCommand = defineCommand({
  name: 'version',
  aliases: [],
  description: 'mbler version\n - Version control command',
  args: [{ name: 'version', description: 'New version to set' }],
  options: [
    {
      name: 'show',
      alias: 's',
      description: 'Show field: commit or version',
    },
  ],
  async handler(ctx) {
    const newVersion = ctx.args.version
    if (newVersion) {
      if (!(await fileExists(ctx.workDir))) {
        showText("can't set workdir version, because not exists")
        return 1
      }
      if (!newVersion || !isValidVersion(newVersion)) {
        showText("can't set version, it is not a valid version")
        return 1
      }
      const pkgJSON = await readFileAsJson<{ version: string }>(
        path.join(ctx.workDir, 'package.json')
      )
      const mblerConfigJSON = await readFileAsJson<MblerConfigData>(
        path.join(ctx.workDir, BuildConfig.ConfigFile)
      )
      mblerConfigJSON.version = pkgJSON.version = newVersion
    } else {
      showVersion(ctx)
    }
    return 0
  },
})
