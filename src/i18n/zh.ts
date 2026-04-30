import { cmdList, language } from "../types";
import version from "../version";

export default {
  description: `MBLER
Minecraft Bedrock Edition
Addon Bulider In Nodejs
在基岩版我的世界上的 nodejs 构建工具
命令 : ${cmdList.join(", ")}
帮助命令 : 
  help
    显示帮助信息
    第二个参数为要查询的命令名称或空
  别名： h
git https://github.com/RuanhoR/mbler/`,
  help: {
    cmds: cmdList,
    help: "mbler [help/h] [?:查看的命令名称]\n  - 查看帮助",
    h: "$help",
    work: "mbler [work/c] [?:相对或绝对路径]\n  - 没有输入路径：查询当前工作目录\n  - 输入路径：设置工作目录",
    c: "$work",
    init: "mbler init\n  - 初始化当前工作目录，可使用 mbler work 指定工作目录或使用参数一次确定(例： mbler init -in ./)\n  - 将会询问选项以完成初始化",
    build: "mbler build\n  - 在工作目录执行构建",
    watch: "mbler watch\n  - 启动构建并开启监视模式，文件变化会自动重新构建",
    lang: 'mbler lang\n- 无参数：显示当前语言\n- 跟 zh 或 en(如 mbler lang en): 设置语言',
    version: "mbler version - 版本管理命令\n- 无参数：显示当前版本和提交哈希\n- --show=<commit|version>：筛选显示内容\n- <新版本号>：更新package.json和配置文件的版本",
    'set-work-dir': "mbler set-work-dir <on|off>\n  - on: 启用工作目录功能\n  - off: 禁用工作目录功能，直接使用 process.cwd()",
    publish: 'mbler publish\n - 将你的附加包发布到 pmnx\n- 参数:\n- -tag: 版本标签名称\n- -build <skip|always>: 是否跳过构建（默认 always）',
    uninstall: 'mbler uninstall @<scope>/<name>@version\n从你的游戏中移除一个包',
    install: 'mbler install @<scope>/<name>@version\n将一个包安装到你的游戏中',
    unpublish: 'mbler unpublish @<scope>/<name>@version\n从 pmnx 取消发布一个包',
    login: 'mbler login <?:token>\n使用 token 登录你的 pmnx 账户\n- 如果没有 token，会向你请求',
    profile: 'mbler profile\n显示当前登录账户信息',
    view: 'mbler view @<scope>/<name>\n查看包的版本列表',
    config: 'mbler config get <key>\nmbler config set <key> <value>\nmbler config point <path>\nmbler config point get'
  },
  init: {
    useUI: '使用UI模块? (y/n): ',
    useGIT: '初始化GIT仓库? (y/n): ',
    name: '项目名称: ',
    welcome: '欢迎使用Mbler初始化向导 语言：中文 mbler 版本： ' + version.version,
    description: "项目描述: ",
    initDes: "初始化依赖? (y/n): ",
    lang: "选择项目语言： ",
    betaApi: "使用Beta Api? (y/n): ",
    mcVersion: "项目使用的mc版本(x.x.x): ",
    noLanguare: "没有输入项目语言，这是必要的",
    noName: "没有项目名称，这是必要的",
    noMCVersion: "输入的 '支持的mc版本' 格式不对"
  },
  default: {
    unexpected: "不正确的命令，",
    youis: "你是否想说: ",
  },
  workdir: {
    set: "[工作目录] 设置为: ",
    nfound: "找不到输入文件夹(无法创建或不是文件夹)",
    disabled: "工作目录功能已禁用，将使用当前目录",
    enabled: "工作目录功能已启用",
    invalidParam: "参数错误，请使用 on 或 off",
  },
  publish: {
    askTip: "输入MCBE游戏绝对目录 (如 /sdcard/Android/data/com.mojang.minecraftpe/files/games)，以进行下一步:  ",
    notLoggedIn: "未登录，请先执行 `mbler login <token>`",
    progress: "进度: {progress}%",
    publishFailed: "发布失败: {error}",
    publishing: "正在发布...",
    building: "正在构建项目...",
    publishToMarket: "正在上传到市场...",
    publishSuccess: "发布成功",
    publishResult: "+ {name}@{version} ({tag})",
    projectPathNotExist: "项目路径不存在",
    outdirNotFound: "未找到构建输出目录配置",
    outdirNotExist: "构建输出目录不存在",
    readmeNotFound: "未找到 README 文件",
    metadataInvalid: "元数据无效",
    packageNameInvalid: "包名格式必须是 @scope/name",
    notLoginError: "未登录",
    tokenMissing: "获取 token 失败",
    unpublishReqFailed: "取消发布请求失败",
    createSessionFailed: "创建发布会话失败",
    uploadZipFailed: "上传 zip 文件失败",
    packageJsonNotFound: "未找到 package.json",
    noBuildScript: "package.json 中未找到 build 脚本",
    buildFailed: "构建失败，退出码: {code}"
  },
  install: {
    failedNoPackageJson: "安装失败：工作目录必须包含 package.json",
    failedNoBuildScript: "安装失败：package.json 必须包含 build 脚本",
    installing: "正在安装包 {pkg}...",
    packageNotFound: "未找到包 {pkg}",
    noVersion: "包 {pkg} 没有可用版本",
    usingLatest: "使用最新版本 {version}",
    noValidAddon: "包内未找到有效 addon",
    success: "包 {pkg}@{version} 已安装为 {id}",
    failed: "安装失败: {error}"
  },
  uninstall: {
    success: "包 {pkg}@{version} 卸载成功",
    failed: "卸载失败: {error}"
  },
  unpublish: {
    success: "包 {pkg}@{version} 取消发布成功",
    failed: "取消发布失败: {error}"
  },
  view: {
    usage: "mbler view @<scope>/<name>",
    packageNotFound: "未找到包 {pkg}",
    title: "包 {pkg} 版本列表:",
    versionLine: "- {version} [{tag}] by {user} at {time}",
    failed: "查看失败: {error}"
  },
  config: {
    usage: "mbler config get <key> | set <key> <value> | point <path> | point get",
    missingArg: "参数不足",
    getResult: "{key} = {value}",
    setSuccess: "已设置 {key} = {value}",
    pointGet: "当前配置文件: {path}",
    pointSetSuccess: "配置文件指向已设置为: {path}",
    pointSetFailed: "配置文件指向设置失败: {error}",
    failed: "配置操作失败: {error}"
  }
} as language;
