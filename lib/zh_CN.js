const config = require('./build/build-g-config.json')
module.exports = {
  help: `MBLER
Minecraft Bedrock Edition
Addon Bulider In Nodejs
在基岩版我的世界上的 nodejs 构建工具
解决到处查文档配置 api 版本的难题
用法： node index.js [command]
* 也可以 npm bin 链接后省略 node 前缀
command: 
  - build -
    打包一个 Gamelib 项目
    别名： bulid
  - help -
    显示帮助信息，此时 [param] 为 NULL，不需要填写
    别名： -h, -help
  - checkout -
    切换路径，如
      node index.js checkout test
    别名： -c
  - init -
    初始化路径的 ${config.PackageFile}
    别名： -i
  - clean -
    删除构建版本，适用于再次构建
    别名： cln
  - version -
    显示当前工作目录的包版本
  - -v -
    显示工具当前版本
  - web_edit -
    使用配套本地网页进行编辑，
  `,
  config_invalid: "非 GameLib 项目",
  err_bulid: "构建错误：识别 #dir 出现错误",
  uncommand: "无效的命令",
  s0: "操作成功：",
  noGit: '\n检测到 Git 安全限制\nGit 拒绝操作，因为该目录可能不属于当前用户或位于系统保护路径。\n请选择处理方式：\n\n1 : 仅将当前目录加入可信区（推荐，安全）\n2 : 全局信任所有目录（不推荐，但方便）\n3 : 取消操作',
  noGitRepo: '没有指定索取的git仓库，安装失败',
  invalidDes: '无效的依赖',
  installGit: {
    NoPackage: `此 GIT 库未包含正确 ${config.PackageFile} 配置`,
    InstallFinally: '安装完成',
    HadBeen: '已有相同包名依赖包，是否替换？ Y/N',
    SetContent: '正在修改索引表'
  }
}