import i18n from '../i18n'
import { CliParam } from '../types'
import { showText } from '../utils'

export function langCommand(cliParam: CliParam, _workdir: string): number {
  const show =
    cliParam.params.length < 2
      ? i18n.__internal.class.currenyLang
      : (i18n.__internal.set(cliParam.params[1] as string),
        i18n.__internal.class.currenyLang)
  showText(show)
  return 0
}
