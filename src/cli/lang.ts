import i18n from '../i18n'
import { showText } from '../utils'
import { defineCommand } from './command'

export const langCommand = defineCommand({
  name: 'lang',
  aliases: [],
  description: i18n.help.lang,
  args: [{ name: 'language', description: 'zh or en' }],
  options: [],
  handler(ctx) {
    const show =
      ctx.args.language === undefined
        ? i18n.__internal.class.currentLang
        : (i18n.__internal.set(ctx.args.language),
          i18n.__internal.class.currentLang)
    showText(show)
    return 0
  },
})
