import { showText } from '../utils'
import { TokenManager } from '../publisher/tokenManager'
import i18n from '../i18n'
import { defineCommand } from './command'

function fmt(t: string, vars: Record<string, string | number | undefined>) {
  return t.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''))
}

export const profileCommand = defineCommand({
  name: 'profile',
  aliases: [],
  description: 'mbler profile\nShow current logged-in account profile',
  args: [],
  options: [],
  async handler(_ctx) {
    try {
      await TokenManager.waitVerify()
      if (!TokenManager.isLogin || !TokenManager.user) {
        showText(i18n.publish.notLoggedIn)
        return -1
      }

      const user = TokenManager.user
      showText(fmt(i18n.profile.user, { name: user.name }))
      showText(fmt(i18n.profile.uid, { uid: user.uid }))
      showText(fmt(i18n.profile.mail, { mail: user.mail }))
      showText(fmt(i18n.profile.created, { created: user.ctime }))
      if (user.avatar_url) {
        showText(fmt(i18n.profile.avatarUrl, { url: user.avatar_url }))
      }

      return 0
    } catch (error) {
      showText(
        fmt(i18n.profile.failed, {
          error: error instanceof Error ? error.message : String(error),
        })
      )
      return -1
    }
  },
})
