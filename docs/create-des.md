# 创建依赖（脚本包）

简介
- 本文档说明如何为 mbler 创建一个可被其它项目复用的“依赖包”（脚本依赖）。
- 依赖包并没有强制的项目结构，但建议遵循本说明的约定以便与 mbler 工具兼容。
- 可参考仓库的内置模块示例：lib/modules/gameLib/（查看该目录了解一个实际的实现示例）。

准备工作
- 熟悉创建项目的流程：参见 docs/create-project.md。
- 需要 Git 用于发布到远端仓库（GitHub/Gitee/GitLab 等）。

配置（推荐放在仓库根目录的 mbler.config.json）
下面给出一个合法的 JSON 示例（注意：JSON 不允许注释）：

```json
{
  "name": "GameLib",
  "description": "一个示例脚本依赖包",
  "version": "0.0.1",
  "mcVersion": [
    "1.21.10",
    "1.21.100"
  ],
  "type": "scriptsDes",
  "script": {
    "main": "./src/index.js",
    "dependencies": {
      "gutils": "inner"
    }
  }
}
```

字段说明
- name: 包名（用于标识与引用）。
- description: 包的简短说明。
- version: 版本号（语义化版本推荐）。
- mcVersion: 支持的 Minecraft 版本范围（示例用数组表示最低与最高版本；具体解析以 mbler 实现为准，请参阅源码或工具行为）。
- type: 包类型（ "scriptsDes" 表示脚本依赖包）。
- script.main: 入口脚本（相对于包根目录），在 Minecraft SAPI 环境中执行。
- script.dependencies: 此依赖自身所依赖的包，格式为 "<包名>": "<源>"。源可以是：
  - "inner"：引用 mbler 内置模块；
  - git 仓库 URL（ssh 或 https）；
  - 本地路径（开发时使用）。

关于代码导出格式
- 依赖中导出的脚本应使用 ES Module 风格（ESM）：使用 export 导出接口。
- 避免使用 CommonJS 的 module.exports / require，因为 Script API 在运行时期望 ESM 导出（以当前实现为准，请参阅 lib 中的实现以确认）。

推荐的最小项目结构
```
your-dependency-repo/
 ├─ mbler.config.json
 ├─ package.json        # 可选，用于开发工具/构建
 ├─ src/
 │  └─ index.js         # script.main 指向的入口（需为 ESM）
 └─ README.md
```

本地开发与调试
- 在本地开发时，你可以将此依赖仓库推送到远端（GitHub/Gitee 等），然后在目标项目中通过 mbler 引入：
  - 安装（从 git 或本地路径拉取该依赖到当前项目的依赖列表）：
    ```bash
    mbler install <git-or-local-path>
    ```
  - 在项目中引用该依赖（将依赖添加到当前工作目录的配置中）：
    ```bash
    mbler add <package-name>
    ```
- 如果仅在本地调试，也可以使用本地路径作为依赖源：mbler install ../path/to/your-dep

发布
- 将依赖包代码推送到远端仓库（如 GitHub、Gitee、GitLab 等）。
- 发布后，其他用户可以通过 git URL 安装你的依赖：
  ```bash
  mbler install <git-repo-url>
  ```
  或在支持按名称查找的环境中：
  ```bash
  mbler add <package-name>
  ```

常见问题与注意点
- JSON 格式：确保 mbler.config.json 为合法 JSON（不要在 JSON 中写注释）。
- mcVersion 数组：若使用数组表达版本范围，确保逗号与字符串格式正确。
- 导出格式错误：若在运行时出现“找不到导出”或模块解析错误，请确认入口文件使用 ESM 导出并且路径正确。
- 依赖循环：避免包之间形成循环依赖，会导致解析/加载异常。
- 与内置模块一致性：若想保持兼容性与示例一致，参考 lib/modules/gameLib/ 的实现与配置。

参考
- 示例：lib/modules/gameLib/（仓库内置模块）
- 项目初始化与使用：docs/create-project.md
- 若需更深入的 API 或行为说明，请查看 lib 目录中的相应模块实现。