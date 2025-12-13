const cmdList = ["dev", "build", "init", "version", "-v", "web_edit", "clean", "checkout", "-c", "-i", "v", "create", "recache", "lang"];

module.exports = {
  help: `MBLER
Minecraft Bedrock Edition
Addon Builder In Nodejs
A Node.js based building tool for Minecraft Bedrock Edition Addons
Solve the problem of looking up documentation and API versions everywhere
Usage: node index.js [command]
* You can also omit the node prefix after npm link
Commands: ${cmdList.join(", ")}

Help Command:
  help
    Display help information
    The second parameter is the command name to query or empty
    Alias: -h, -help`,
  
  config_invalid: "Not a GameLib project",
  err_bulid: "Build error",
  uncommand: "Invalid command",
  s0: "Operation succeeded",
  noGit: '\nGit security restriction detected\nGit rejected the operation because the directory may not belong to the current user or is in a system-protected path.\nPlease choose an option:\n\n1: Add only the current directory to the trusted zone (recommended, safe)\n2: Trust all directories globally (not recommended, but convenient)\n3: Cancel the operation',
  SameDes: "Duplicate dependency name",
  invalidConfig: "Invalid configuration",
  inited: "Already initialized",
  noGitRepo: 'No Git repository specified, installation failed',
  invalidDes: 'Invalid dependency',
  workPackV: "Current working directory package version:",
  init: {
    name: "Project name: ",
    desc: "Project description: ",
    useMcVersion: "Supported Minecraft versions: ",
    useSapi: "Use Script API? (Y/N): ",
    useTs: "Use TypeScript? (Y/N): ",
    InputFormatErr: "Not a correct x.x.x version format, please re-enter\n  ",
    main: "Main script path (without .js suffix, default: index): ",
    useUi: "Use UI? (Y/N): ",
    ReInput: 'Does not meet the specification, please retry:\n  '
  },
  dev: {
    start: "Start live rebuild, the following is the first build",
    start_d: "Start incremental build",
    tip: "Detected change: "
  },
  installGit: {
    NoPackage: `This GIT repository does not contain the correct mbler configuration`,
    InstallFinally: 'Installation completed',
    HadBeen: 'A dependency package with the same name already exists, replace it? Y/N',
    SetContent: 'Modifying the index table'
  },
  vm: {
    shouldNotImp: "Importing this module is not allowed because it may be used for unsafe actions",
    runScriptErr: "Error running script, stack trace: "
  },
  commands: {
    list: cmdList,
    dev: "mbler dev \nListen for file changes and rebuild automatically",
    build: "mbler build \nPackage the project into a standard MCBE behavior pack, see docs for details",
    init: `mbler init \nInitialize the configuration file in the specified path via interactive command line, alias: -i`,
    version: "mbler version [null | x.x.x] \nView or set the package version of the current working directory",
    "-c": "$checkout",
    "-i": "$init",
    "-v": "$v",
    v: "mbler [v/-v] \nView the Mbler tool version itself",
    checkout: "mbler [checkout/-c] [null | PATH]\nView (if second param is null) or switch the working directory",
    "web_edit": "mbler web_edit \nLaunch a local HTTP-based text editor for the working directory (not recommended for development)",
    create: "mbler create [npm package name | git url | path]\nDownload from the specified source (cached) and create a template package in a sandbox VM, similar to npm create",
    recache: "mbler recache \nReset the cache",
    lang: "mbler lang [lang name] \nSet the language, e.g. mbler lang en_US\nAvailable languages are:\n 1. zh_CN\n 2. en_US \n 3. zh_TW"
  }
};
