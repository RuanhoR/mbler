import i18n from "../i18n";
import { CliParam } from "../types";
import { showText } from "../utils";

export function langCommand(cliParam: CliParam, workdir: string): number {
  let show = '';
  if (cliParam.params.length < 2) {
    show = i18n.__internal.class.currenyLang;
  } else {
    i18n.__internal.set(cliParam.params[1] as string);
    show = i18n.__internal.class.currenyLang;
  }
  showText(show);
  return 0;
}