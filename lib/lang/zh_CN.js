const cmdList =  ["dev", "build", "init", "version", "-v", "web_edit", "clean", "checkout", "-c", "-i", "v", "create", "recache", "lang"];
module.exports = {
  help: `MBLER
Minecraft Bedrock Edition
Addon Bulider In Nodejs
在基岩版我的世界上的 nodejs 构建工具
解决到处查文档配置 api 版本的难题
用法： node index.js [command]
* 也可以 npm link 链接后省略 node 前缀
命令 : ${cmdList.join(", ")}
帮助命令 : 
  help
    显示帮助信息
    第二个参数为要查询的命令名称或空
    别名： -h, -help`,
  config_invalid: "非 GameLib 项目",
  err_bulid: "构建错误",
  uncommand: "无效的命令",
  s0: "操作成功 ",
  noGit: '\n检测到 Git 安全限制\nGit 拒绝操作，因为该目录可能不属于当前用户或位于系统保护路径。\n请选择处理方式：\n\n1 : 仅将当前目录加入可信区（推荐，安全）\n2 : 全局信任所有目录（不推荐，但方便）\n3 : 取消操作',
  SameDes: "同名的依赖",
  invalidConfig: "无效的配置",
  inited: "已经初始化过了",
  noGitRepo: '没有指定索取的git仓库，安装失败',
  invalidDes: '无效的依赖',
  workPackV: "当前工作目录包版本：",
  init: {
    name: "项目名称 : ",
    desc: "项目描述 : ",
    useMcVersion: "支持的minecraft版本 : ",
    useSapi: "使用Script Api吗？(Y/N) ",
    useTs: "使用TypeScript吗？(Y/N) ",
    InputFormatErr: "不是正确的x.x.x格式版本号，重新输入\n  ",
    main: "主脚本路径，不包含js后缀( 默认 index ) : ",
    useUi: "使用 UI 吗？(Y/N) ",
    ReInput: '不符合规范 重试：\n  '
  },
  dev: {
    start: "开始即时监听构建 以下为第一次构建",
    start_d: "开始增量构建",
    tip: "监听到变化 : "
  },
  installGit: {
    NoPackage: `此 GIT 库未包含正确配置mbler`,
    InstallFinally: '安装完成',
    HadBeen: '已有相同包名依赖包，是否替换？ Y/N',
    SetContent: '正在修改索引表'
  },
  vm: {
    shouldNotImp: "禁止导入模块，因为该模块可以用于不安全举动",
    runScriptErr: "运行脚本出错，错误栈 "
  },
  commands: {
    list: cmdList,
    dev: "mbler dev \n监听文件，在修改时重打包",
    build: "mbler build \n打包项目，把mbler项目打包成标准mcbe行为包，mbler项目介绍详见文档",
    init: `mbler init \n初始化路径的配置文件，以命令行交互式创建，别名： -i`,
    version: "mbler version [null | x.x.x] \n查看或设置当前工作目录的包版本",
    "-c": "$checkout",
    "-i": "$init",
    "-v": "$v",
    v: "mbler [v/-v] \n查看mbler工具本身的版本",
    checkout: "mbler [checkout/-c] [null | PATH]\n查看(当第二个参数为null时)或切换工作目录",
    "web_edit": "mbler web_edit \n开启本地 HTTP 工作目录的文本编辑器，开发中不建议食用",
    create: "mbler create [npm package name | git url | path]\n从指定源下载后(有缓存)进行在沙盒vm内的创建模板包，类似npm create",
    recache: "mbler recache \n重置缓存",
    lang: "mbler lang [lang name] \n设置语言，如 mbler lang zh_CN\n目前语言有 \n 1. zh_CN \n 2. en_US \n 3. zh_TW"
  }
}