# 命令用法

本页列出 mbler 的常用命令、格式、别名与简要说明。大多数命令需要先设置或进入工作目录（参见 `checkout / -c`）。如果你在开发仓库中频繁运行命令，建议使用 `npm link` 将本地 mbler 链接为全局命令（见下方提示）。

重要提示
- 如果你还在使用 `node index.js <cmd>`，建议在仓库根目录运行 `npm link`，之后可直接使用 `mbler <cmd>`。
- 标注为 {BETA} 的功能为实验性/未完善，请谨慎使用并反馈问题。

命令总览

| 命令 | 用法 | 别名 | 说明 |
| --- | --- | --- | --- |
| checkout | `mbler checkout <PATH \| null>` | `-c` | 设置或查看工作目录。传入 `null` 时显示当前工作目录；传入目录路径则切换到该目录（支持相对/绝对路径）。 |
| build | `mbler build` | --- | 打包当前工作目录（构建行为包/资源）。 |
| init | `mbler init` | `-i` | 在当前工作目录初始化项目骨架（交互式）。 |
| version | `mbler version` | — | 显示当前工作目录项目的版本（package 或 mbler 配置中的版本）。 |
| v | `mbler v` | `-v` | 显示 mbler 工具自身的版本。 |
| clean | `mbler clean` | `cln` | 清理构建产生的临时文件与输出痕迹。 |
| install | `mbler install <git-url \| 本地路径>` | — | 从指定 git 仓库或本地路径安装/拉取一个脚本依赖包到本地依赖仓库。 |
| add | `mbler add <package-name>` | — | 在当前工作目录的配置中添加已安装依赖的声明（将依赖加入项目引用）。 |
| remove | `mbler remove <package-name>` | — | 从当前工作目录配置中删除依赖声明（不删除已安装包）。 |
| uninstall | `mbler uninstall <package-name>` | — | 删除已安装的依赖包（从依赖仓库中移除）。 |
| dev | `mbler dev` | — | 开启开发模式：监听源码变更并实时编译/构建（便于本地调试）。 |
| recache | `mbler recache` | — | 重置缓存 |
| help | `mbler help <命令名>` | — | 查看该命令的帮助 |
| lang | `mbler lang <语言名>` | — | 切换语言 |
| create | `mbler create <git repo | dir | npm package>` | — | 按模板脚本进行初始化，类似 `npm create` |
常用示例

- 切换/查看工作目录
```bash
# 切换到 myproject 目录并把它设为当前工作目录
mbler checkout ./myproject
# checkout 太长了，推荐用 -c
mbler -c ./myproject

# 查看当前工作目录
mbler -c
```

- 初始化项目（在当前工作目录执行交互式初始化）
```bash
cd ./myproject && mbler -c ./
mbler init
```
- 切换语言
```bash
# 切换到简体中文，其他的还有 en 英语 
mbler lang zh
mbler help lang
```
- 构建
```bash
# 构建当前工作目录
mbler build
```

- 安装与管理依赖
```bash
# 从远端 git 仓库安装依赖（会把包拉入本地依赖仓库）
mbler install https://github.com/owner/dep-repo.git
# 本地路径安装（开发中常用）
mbler install ../local-dep
# 在项目中声明已安装的依赖（将其加入项目配置）
mbler add gameLib
# 删除项目配置中的依赖声明
mbler remove gameLib
# 卸载已安装的依赖包（从本地依赖仓库移除）
mbler uninstall gameLib
```

- 开发与热重载
```bash
# 进入开发模式，自动监听并构建
mbler dev
```

其它说明与常见问题
- npm link 相关：执行 `npm link` 后，请确认全局 npm bin 在系统 PATH 中。Linux/macOS 可用 `which mbler` 确认，Windows 可用 `where mbler`。
- 命令上下文：多数命令（如 build、add、remove、version）依赖当前工作目录（checkout 的指向），确保使用前先`mbler -c ./`绑定工作目录一下。