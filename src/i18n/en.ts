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
    'set-work-dir': "mbler set-work-dir <on|off>\n  - on: Enable work dir feature\n  - off: Disable work dir feature, use process.cwd() directly",
    publish: 'mbler publish\n - Publish your package to pmnx\n- Params:\n-   -tag: version tag name\n-   -build <skip|always>: skip or run build before publish (default: always)',
    uninstall: 'mbler uninstall @<scope>/<name>@version\nRemove a package from your game',
    install: 'mbler install @<scope>/<name>@version\nInstall a package to your game',
    unpublish: 'mbler unpublish @<scope>/<name>@version\nUnpublish a package from pmnx',
    login: 'mbler login <?:token>\nUse token login your pmnx account',
    profile: 'mbler profile\nShow current logged-in account profile',
    view: 'mbler view @<scope>/<name>\nShow package versions',
    config: 'mbler config get <key>\nmbler config set <key> <value>\nmbler config point <path>\nmbler config point get'
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
  publish: {
    askTip: "Plase input the absolute path of your MCBE game directory (like /sdcard/Android/data/com.mojang.minecraftpe/files/games) for next step:  ",
    notLoggedIn: "Not logged in. Use `mbler login <token>` first.",
    progress: "Progress: {progress}%",
    publishFailed: "Publish failed: {error}",
    publishing: "Publishing...",
    building: "Building project...",
    publishToMarket: "Publishing to marketplace...",
    publishSuccess: "Publish successful",
    publishResult: "+ {name}@{version} ({tag})",
    projectPathNotExist: "Project path does not exist",
    outdirNotFound: "Build output directories not found",
    outdirNotExist: "Build output directories do not exist",
    readmeNotFound: "README file not found",
    metadataInvalid: "Invalid metadata",
    packageNameInvalid: "Package name must be in the format of @scope/name",
    notLoginError: "Not logged in",
    tokenMissing: "Failed to get token",
    unpublishReqFailed: "Failed to unpublish package",
    createSessionFailed: "Failed to create publish session",
    uploadZipFailed: "Failed to upload zip file",
    packageJsonNotFound: "package.json not found",
    noBuildScript: "No build script found in package.json",
    buildFailed: "Build failed with code {code}"
  },
  install: {
    failedNoPackageJson: "Install failed: work directory must contain package.json",
    failedNoBuildScript: "Install failed: package.json must contain a build script",
    installing: "Installing package {pkg}...",
    packageNotFound: "Package {pkg} not found",
    noVersion: "Package {pkg} has no available version",
    usingLatest: "Using latest version {version}",
    noValidAddon: "No valid addon found in package",
    success: "Package {pkg}@{version} installed successfully as {id}",
    failed: "Install failed: {error}"
  },
  uninstall: {
    success: "Package {pkg}@{version} uninstalled successfully",
    failed: "Uninstall failed: {error}"
  },
  unpublish: {
    success: "Package {pkg}@{version} unpublished successfully",
    failed: "Unpublish failed: {error}"
  },
  view: {
    usage: "mbler view @<scope>/<name>",
    packageNotFound: "Package {pkg} not found",
    title: "Package {pkg} versions:",
    versionLine: "- {version} [{tag}] by {user} at {time}",
    failed: "View failed: {error}"
  },
  config: {
    usage: "mbler config get <key> | set <key> <value> | point <path> | point get",
    missingArg: "Missing argument",
    getResult: "{key} = {value}",
    setSuccess: "Set {key} = {value}",
    pointGet: "Current config file: {path}",
    pointSetSuccess: "Config file pointer set to: {path}",
    pointSetFailed: "Failed to set config pointer: {error}",
    failed: "Config command failed: {error}"
  }
} as language
