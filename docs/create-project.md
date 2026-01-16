# 使用 mbler 创建你的第一个 Minecraft 行为包

## 简介
- 本指南演示如何使用 mbler 快速创建并管理一个 Minecraft 行为包（Behavior Pack）。文档示例基于仓库自带的 test 示例，建议参考 test 文件夹了解完整配置与目录结构。
- 说明：JSON 标准不允许注释，文档中演示的 JSON 示例已去掉注释；若你在编辑过程中希望保留说明，请使用 README 或单独的注释文件。

## 前置
- Node.js（包含 npm）已安装。
- Git 已安装并能正常使用。
- 如果你想直接运行仓库代码，需要克隆本项目；若仓库有镜像（例如 Gitee），可按需选择。

## 获取代码
推荐使用 GitHub 仓库：
从 [这里](https://github.com/RuanhoR/mbler/releases) 选择版本下载，到达这个目录(使用命令行cd)，运行`npm link`  
也可使用 Gitee 的克隆链接或github镜像站，可能速度更快  
本项目目前迁移`typescript`，你也可以直接运行`tsc`进行构建
## 安装与运行（开发阶段）
有两种常见方式在本地运行 mbler：全局链接（推荐用于经常使用命令行工具的情况）
在仓库根目录运行：
```bash
npm link
```
此命令会把本地包链接为全局命令（在其他目录可直接使用 mbler）。
更新仓库（获取最新特性）
```bash
git pull
```
## 食用
按以下教程进行使用！
### 创建项目（初始化）
- 在你想创建项目的目录下新建一个文件夹，或直接在当前目录执行初始化命令。
- 注意：`-c` 选项并不是用来“创建”目录的，它用于切换/设置 mbler 的工作目录（即告诉 mbler 在哪个目录执行后续操作）。下面给出正确的用法示例。

### 切换工作目录（-c）
将 mbler 的工作目录切换到指定路径（支持相对或绝对路径）：
```bash
mbler -c <目标目录路径>
```
示例：
```bash
# 切换到已存在目录 myproject
mbler -c ./myproject
```

### 创建/初始化项目（init）
在目标工作目录执行初始化交互流程：
```bash
mbler init
```
可以结合使用示例
如果你想在一个新目录中初始化项目，可以先创建目录并切换工作目录，再运行 init：
```bash
mkdir myproject
mbler -c ./myproject
mbler init
```
或者（传统方式）直接切换到目录再 init：
```bash
mkdir myproject
cd myproject
mbler -c .
mbler init
```
### 配置说明（示例 mbler.config.json）
下面是一个示例（注意：JSON 不带行内注释）：

```json
{
  "name": "test",
  "description": "示例项目",
  "version": "0.1.1",
  "mcVersion": "1.21.100",
  "script": {
    "ui": true,
    "main": "main.js",
    "UseBeta": true,
    "dependencies": {
      "gameLib": "inner"
    }
  },
  "subpack": {
    "pack-id": "显示的名称"
  },
  "minify": true,
  "outdir": {
    "resources": "/path/to/resources-output",
    "behavior": "/path/to/behavior-oitput",
    "dist": "./dist/dist.mcaddon"
  }
}
```

字段说明
- name: 项目名称。
- description: 描述。
- version: 版本号。
- mcVersion: 目标 Minecraft 版本（必填），用于推断 Script API 版本。
- script.ui: 是否启用 @minecraft/ui（如启用则包含 UI 相关逻辑）。
- script.main: 主脚本入口文件（相对于脚本目录）。
- script.UseBeta: 是否启用 Beta 版 Script API。
- script.dependencies: 依赖声明，格式为 "<包名>": "<源>"。源可以是 git 链接、本地路径或 "inner"（内置）。
- subpack: 子包声明，对应 manifest.json 的 subpack 配置，子包内容放在 /subpack/<pack-id>。
- minify: 是否对输出进行压缩（目前压缩 JSON 与 JavaScript）。
- outdir.resources 资源包输出目录，可以是游戏内的，`mbler`会对uuid做处理确保不冲突 默认 ./dist/res
- outdir.behavior 行为包输出目录，默认 ./dist/dep
- outdir.dist 当终端变量`MBLER_BUILD_MODULE`为dist时，将会进行zip压缩，压缩成可直接导入游戏的mcaddon文件，默认 ./dist.mcaddon
## 本地 npm 快捷命令
- npm run build
对应命令 `MBLER_BUILD_MODULE=dist mbler build` 用mbler进行打包项目，并且顺便进行zip压缩成mcaddon
- npm run dev
对应命令 `mbler dev` 用mbler进行 检测到修改时重新打包，不进行mcaddon打包
- npm run dev-build
对应命令 `MBLER_BUILD_MODULE=dev mbler build` 用mbler进行打包项目，不进行mcaddon打包

## 关于依赖（install / add / remove）
- 从指定来源安装依赖（例如 git 或本地路径）：
```bash
mbler install <git-or-local-path>
```
- 在工作目录中添加已知依赖（package 名称）：
```bash
mbler add <package-name>
```
- 删除工作目录中的依赖：
```bash
mbler remove <package-name>
```

## 创建自定义依赖
- 如需创建一个可被 mbler 管理的依赖包，详见 (创建依赖)[create-des.md]（仓库内链接）。

package.json 与构建说明
- 项目目录下会存在 package.json，用于 npm 识别，但在本地开发时通常不需要你运行全局 npm install。
- 构建流程会在临时/输出目录复制 package.json，再在该目录执行 npm install（如果需要编译 TypeScript 才会安装依赖）。
- 因项目需要先整理项目结构才可正确编译 TypeScript，所以不要直接在源目录运行 npm install 来进行构建。

## 快速工作流推荐
1. 使用 mbler init 创建项目骨架或复制 test 示例（在目标工作目录下执行 init）。
2. 本地开发脚本与资源（res、scripts 等）。
3. 运行 mbler build（或项目提供的构建命令）生成输出到 outdir。
4. 将输出放入 Minecraft 的 behavior/resource pack 进行测试。

## 项目结构（示例）
```
project
 ├─ package.json            # npm 识别用（不必在源目录 npm install）
 ├─ mbler.config.json
 ├─behavior
 ├── scripts
 │  └── *.js | *.json
 ├── res
 │  ├── ... 一些mcbe原生的资源文件，如 items entities等
 └── subpack
    └── <pack-id>
       └── (同上结构，需在 mbler.config.json 中声明，subpack原生支持不建议使用)
 ├─ resources
 ├── mcbe原生资源包结构，除了不需要包含 manifest.json(自动配置/生成)
```
## 其他
 - 如果在`scripts`文件夹里写json，那么可以在js里面用 `import {data as xxx} from "相对路径"` 导入数据，mbler会处理期间关系(原生mc不支持导入json)
## 调试与常见问题
- JSON 注释问题：请勿在实际 JSON 文件中写注释，编辑器内可用 .jsonc 在本地临时注释，但最终提交给 mbler 的文件必须为合法 JSON。
- npm link 无效：确认你在仓库根目录执行了 npm link，并且系统 PATH 中包含全局 npm bin。可用 `which mbler`（Linux/macOS）或 `where mbler`（Windows）确认链接是否生效。
- TypeScript 编译失败：构建流程会在构建目录再执行 npm install 并编译；如果本地缺少依赖或版本不匹配，请检查 mbler.config.json 中的配置与 package.json 的依赖版本。
- 运行时报错找不到模块：确认 script.main 指定的入口存在且在构建时被正确拷贝到输出目录。

## 扩展阅读与资源
- 示例项目：仓库根目录的 test 文件夹（参考其配置与结构）。
- 依赖创建说明：[创建依赖](./create-des.md)
- 如需查看源码实现（API 与行为），请在 lib/ 目录下查阅相关模块或翻阅相关教程