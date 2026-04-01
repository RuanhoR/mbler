import { cmdList, language } from '../types'
import version from '../version'

export default {
  description:
    'MBLER\nMinecraft Bedrock Edition\nAddon Bulider In Nodejs\nnodejs build tools on bedrock version of minecraft\nCommands: ' +
    cmdList.join(', ') +
    '\nHelp command:\n  help\n    Show help information\n    The second parameter is the name of the command to be queried or empty\n    Alias: -h, -help\n git https://github.com/RuanhoR/mbler/',
  help: {
    cmds: cmdList,
    help: 'mbler [help/h] [?: command name]\n  - see tip',
    h: '$help',
    work: 'mbler [work/c] [?: path]\n  - No input path: see current work dir\n  - input path: set as  current dir',
    c: '$work',
    init: 'mbler init\n  - Init current work dir, you can use `mbler work` command or use command param(like be： mbler init -in ./)',
    build: 'mbler build\n  - perform a build using the library API',
    b: '$build',
    watch:
      'mbler watch\n  - run build and enter watch mode; changes will trigger rebuilds',
    lang: 'mbler lang [?:languare]\n- No args: show current languare\n- languare = "zh” | “en": set languare',
    version:
      'mbler version\n - Version control command\n- No args: Shows version + commit hash\n- --show=<commit|version>: Filters output\n- <new_version>: Updates version in both package.json and config file',
    'set-work-dir': "mbler set-work-dir <on|off>\n  - on: Enable work dir feature\n  - off: Disable work dir feature, use process.cwd() directly"
  },
  init: {
    useUI: 'Use UI? (y/n): ',
    useGIT: 'Initialize GIT repository? (y/n): ',
    name: 'Project name: ',
    description: "Project description: ",
    initDes: "Initialize dependencies? (y/n): ",
    welcome: 'Welcome to use Mbler init wizard! Language: English mbler version: ' + version.version,
    lang: "Project languare: ",
    betaApi: "use beta api(y/n): ",
    mcVersion: 'Minecraft version(be like: x.x.x): ',
    noLanguare: 'project languare is required',
    noMCVersion: "project mcVersion format is not right",
    noName: "project name is required"
  },
  default: {
    unexpected: 'Not found this command，',
    youis: 'You want to input: ',
  },
  workdir: {
    set: '[path to]: ',
    nfound: "not found this dir(can't create or not directory)",
    disabled: "Work dir disabled, will use current directory",
    enabled: "Work dir enabled",
    invalidParam: "Invalid parameter, use on or off",
  },
} as language
