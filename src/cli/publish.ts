import { showText } from '../utils'
import { PublishManager } from '../publisher/publishManager'
import { TokenManager } from '../publisher/tokenManager'
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
      description: i18n.publish.tagDescription,
      default: 'latest',
    },
    {
      name: 'build',
      alias: 'b',
      description: i18n.publish.buildDescription,
      default: 'enable',
    },
  ],
  async handler(ctx) {
    const tag = ctx.opts.tag || 'latest'
    const buildRaw = (ctx.opts.build || '').trim().toLowerCase()
    const buildMode = buildRaw === 'skip' ? 'skip' : 'enable'
    try {
      await TokenManager.waitVerify()
      if (!TokenManager.isLogin) {
        showText(i18n.publish.notLoggedIn)
        return -1
      }

      await PublishManager.publish(ctx.workDir, {
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
