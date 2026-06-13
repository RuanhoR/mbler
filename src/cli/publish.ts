import { showText } from '../utils'
import { PublishManger } from '../publisher/publishManger'
import { TokenManger } from '../publisher/tokenManger'
import i18n from '../i18n'
import { defineCommand } from './command'

function fmt(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export const publishCommand = defineCommand({
  name: 'publish',
  aliases: [],
  description: i18n.help.publish,
  args: [],
  options: [
    {
      name: 'tag',
      alias: 't',
      description: 'Version tag name',
      default: 'latest',
    },
    {
      name: 'build',
      alias: 'b',
      description: 'Build mode: skip or enable',
      default: 'enable',
    },
  ],
  async handler(ctx) {
    const tag = ctx.opts.tag || 'latest'
    const buildRaw = (ctx.opts.build || '').trim().toLowerCase()
    const buildMode = buildRaw === 'skip' ? 'skip' : 'enable'
    try {
      await TokenManger.waitVeirfy()
      if (!TokenManger.isLogin) {
        showText(i18n.publish.notLoggedIn)
        return -1
      }

      await PublishManger.publish(ctx.workDir, {
        build: buildMode,
        tag,
        onProgress: (progress) =>
          showText(fmt(i18n.publish.progress, { progress })),
        onMessage: (message) => showText(message),
      })
      return 0
    } catch (error) {
      showText(
        fmt(i18n.publish.publishFailed, {
          error: error instanceof Error ? error.message : String(error),
        })
      )
      return -1
    }
  },
})
