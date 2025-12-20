const cmdList = ["dev", "install", "build", "init", "version", "-v", "web_edit", "clean", "checkout", "-c", "-i", "v", "create", "recache", "lang"];
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
    别名： -h, -help
 git https://github.com/RuanhoR/mbler/`,
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
  cleanFinally: "清理构建版本成功",
  noCommandTip: "你是否想表达 : ",
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
  build: {
    build_info_header: '--- 构建信息一览表 ---',
    project_path: '项目路径:',
    output_dir: '输出目录:',
    minify_enabled: '启用压缩:',
    build_time: '构建时间:',
    // 构建状态
    build_success: '构建成功 耗时 :',
    build_failed: '构建失败',
    // 配置与校验
    config_invalid: '配置无效',
    package_file_missing_fields: `字段缺失：必需字段 ${JSON.stringify(['name', 'description', 'version', 'mcVersion'])}`,
    script_main_entry_missing: '启用了 script，但未指定 main 入口文件',
    subpack_folder_not_found: '{id} 子包文件夹不存在，打包失败',
    subpack_processing_failed: `子包 {id} 处理失败: {error}`,
    includes_not_array: 'includes.json 不是数组，跳过资源复制',

    // 警告/错误日志常用语
    ts_no_files: '未发现任何 .ts 文件，跳过 TypeScript 编译',
    ts_diagnostics: '{file} ({line},{character}): {message}',
    ts_compilation_error: '编译 TypeScript 时出错',

    // 其他日志/提示
    no_ts_files_skip: '未发现任何 .ts 文件，跳过 TypeScript 编译',
    copying_subpack_script: '已复制子包脚本目录',
    copying_subpack_resources: '正在复制子包其他资源',
    removing_js_files: '移除脚本目录中的 .js 文件',
    copying_compiled_ts: '复制编译后的 TypeScript 文件',
    minification_error: '代码压缩失败',
    temp_mod_init: '初始化临时模块目录',
    script_entry_required: 'script 启用但未设置 main 入口',
    invalid_script_entry: 'main 入口文件为空或无效',
    module_copy_success: '模块已复制到输出目录',
    invalid_subpack_type: 'subpack 不是对象，跳过处理',
    invalid_includes_type: 'includes.json 不是数组，跳过资源复制',
    handle_includes_info: '处理 includes 资源拷贝',
    minification_skipped: 'includes.json 非数组，跳过代码压缩',
    remove_js_files_info: '移除编译出的 .js 文件（如来自 ts）',
    process_minification: '开始代码压缩处理',
    copy_compiled_ts_only: '仅复制编译后的 ts 文件',
    temp_mod_usage: '使用临时目录处理 TypeScript 编译',
    build_failed_catch: '构建流程异常终止',
    error_message_log: '错误信息: ',
    exit_with_code: '进程退出，代码: ',
    class_pri_locked: '锁定类内关键属性',
    object_pri_enforced: '设置对象属性不可枚举',
    no_resources: "没找到资源包资源，跳过资源编译",
    ziped: "zip 压缩完成，你可以直接导入游戏啦\nmcaddon文件在 : ",
    tip_dist: "打包模式 :"
  },
  buildBase: {
    npm_deps_skipped_no_json: "没有找到npm依赖，跳过安装",
    build_time: '构建时间',
    cannot_read_project_config: '无法读取项目配置文件',
    invalid_project_config_format: '项目配置文件格式无效',
    starting_npm_install: '开始安装 npm 依赖',
    npm_install_completed: '依赖安装完成',
    npm_install_exit_code: 'npm install 退出码:',
    npm_install_error: 'npmInstall 错误',
    calculating_sha1: '计算文件 SHA1 哈希值',
    file_not_exist: '文件不存在',
    config_hash_stored: '配置哈希已存储',
    package_hash_stored: '包哈希已存储',
    config_changed: '配置已变更',
    package_changed: '包已变更',
    saving_current_hash: '保存当前哈希到缓存',
    removing_js_files: '移除脚本目录中的 .js 文件',
    removing_js_error_ignored: '移除 .js 文件错误，已忽略',
    removing_npm_des: '移除 npm 依赖描述',
    module_not_included: '模块未包含，跳过删除',
    recursive_remove_js: '递归移除 Js 文件',
    reading_file_content: '读取文件内容'
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
    lang: "mbler lang [lang name] \n设置语言，如 mbler lang zh_CN\n目前语言有 \n 1. zh 中文  \n 2. en 英文",
    install: "mbler install [modulesName[]]\n安装模块，会顺便扫描配置中声明的模块"
  }
}