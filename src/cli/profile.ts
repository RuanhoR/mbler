import { showText } from '../utils'
import { TokenManager } from '../publisher/tokenManager'
import i18n from '../i18n'
import { defineCommand } from './command'

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
      showText(`User: ${user.name}`)
      showText(`UID: ${user.uid}`)
      showText(`Mail: ${user.mail}`)
      showText(`Created: ${user.ctime}`)
      if (user.avatar_url) {
        showText(`Avatar URL: ${user.avatar_url}`)
      }

      return 0
    } catch (error) {
      showText(
        `Profile failed: ${error instanceof Error ? error.message : String(error)}`
      )
      return -1
    }
  },
})
