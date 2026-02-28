import { cmdList, language } from "../types";

export default {
  description:
    "MBLER\nMinecraft Bedrock Edition\nAddon Bulider In Nodejs\nnodejs build tools on bedrock version of minecraft\nCommands: " +
    cmdList.join(", ") +
    "\nHelp command:\n  help\n    Show help information\n    The second parameter is the name of the command to be queried or empty\n    Alias: -h, -help\n git https://github.com/RuanhoR/mbler/",
  help: {
    cmds: cmdList,
    help: "mbler [help/h] [?: command name]\n  - see tip",
    h: "$help",
    work: "mbler [work/c] [?: path]\n  - No input path: see current work dir\n  - input path: set as  current dir",
    c: "$work",
    init: "mbler init\n  - Init current work dir, you can use `mbler work` command or use command param(like be： mbler init -in ./)",
  },
  default: {
    unexpected: "Not found this command，",
    youis: "You want to input: ",
  },
  workdir: {
    set: "[path to]: ",
    nfound: "not found this dir(can't create or not directory)",
  },
} as language;
