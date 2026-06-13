import { showText } from '../utils'
import { TokenManger } from '../publisher/tokenManger'
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
      await TokenManger.waitVeirfy()
      if (!TokenManger.isLogin || !TokenManger.user) {
        showText(i18n.publish.notLoggedIn)
        return -1
      }

      const user = TokenManger.user
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
