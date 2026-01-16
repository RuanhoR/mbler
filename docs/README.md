# Mbler

一个聚焦于 **Minecraft Bedrock Edition 行为包开发** 的构建与打包工具。

## 特性
- 快速创建与初始化项目
- 自动打包为可导入的行为包
- 支持脚本依赖（Git、本地、内置）
- 子包与模块化构建支持
- 支持 JSON 与 JS 自动压缩
- i18n多语言支持

---

## 📦 安装

确保你已经安装以下工具：
- Node.js 与 npm
- Git

推荐使用 GitHub 仓库：
从 [这里](https://github.com/RuanhoR/mbler/releases) 选择版本下载，到达这个目录(使用命令行cd)，运行`npm link`  
也可使用 Gitee 的克隆链接或github镜像站，可能速度更快  
本项目目前迁移`typescript`，你也可以直接运行`tsc`进行构建
安装成功后，你可以直接使用：
```bash
# 获取版本
mbler -v
```

---

## 🚀 快速开始

```bash
mbler -c <项目路径>
mbler init
```

...

---

## 📚 文档目录
- [创建第一个项目](./create-project.md)
- [命令参考](./command.md)
- [创建依赖](./create-des.md)
- [内置依赖说明](./inner-say.md)
- [创建初始模板体](./create-initializer.md)