# MBLER

---

[![CI](https://github.com/RuanhoR/mbler/actions/workflows/lint.yml/badge.svg)](https://github.com/RuanhoR/mbler/actions/workflows/lint.yml)
[![npm](https://img.shields.io/npm/v/mbler)](https://npmjs.com/package/mbler)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Node](https://img.shields.io/node/v/mbler)](https://nodejs.org)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-red)](https://gitee.com/n304sc-haoran/mbler.git)
[![Star](https://img.shields.io/github/stars/RuanhoR/mbler)](https://github.com/RuanhoR/mbler/stargazers)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/9e9522b1f8f642d28e3a1d20ff5dfc19)](https://app.codacy.com/gh/RuanhoR/mbler/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)

---

基于 [Rolldown](https://rolldown.rs) 构建的 Minecraft 基岩版附加包开发工具链。

## 功能特性

- **MCX DSL** — 具有类型安全的 Minecraft 脚本领域特定语言
- **Manifest 生成器** — 自动生成带有确定性 UUID 和模块依赖的 `manifest.json`
- **打包** — 通过 Rolldown 将脚本打包成单个 ESM 文件，自动外部化 Minecraft API
- **组件构建** — 通过 MCX 图像组件支持资源导入（`.png`、`.svg` 等）
- **监听模式** — 通过 `mbler watch` 实现增量重建和文件变更复制
- **压缩** — 支持 `oxc`（默认）、`terser` 和 `esbuild` 压缩器
- **构建缓存** — 可配置的缓存策略（none/memory/file/filesystem/auto）以加速重建
- **发布打包** — 通过 `BUILD_MODULE=release` 环境变量构建 `.mcaddon` 归档包
- **PMNX 市场** — 发布、安装、卸载和管理附加包
- **i18n** — 内置国际化支持（英文和中文）

## 安装

**前置要求：** Node.js >= 20.0.0, pnpm（推荐）或 npm

```bash
npm install -g mbler
```

## 快速开始

```bash
pnpm create mbler

pnpm build
```

## 示例项目

[Bedwars Addon](https://github.com/RuanhoR/mcbe-bedwars-addon) | [RedStonePlugin Addon: Place, Cut](https://github.com/RuanhoR/mcbe-redstoneplugin-addon) | [Luckly Block Addon](https://github.com/RuanhoR/LuckBlock)

## CLI 命令

| 命令                                     | 别名  | 描述                                        |
| ---------------------------------------- | ----- | ------------------------------------------- |
| `help [command]`                         | `h`   | 显示命令帮助                                |
| `init [args...]`                         |       | 初始化项目配置文件                          |
| `build`                                  |       | 构建附加包（行为包 + 资源包）               |
| `watch`                                  |       | 监听模式，增量重建                          |
| `work [path]`                            | `c`   | 设置或显示工作目录                          |
| `set-work-dir <on\|off>`                 |       | 启用/禁用持久化工作目录                     |
| `version [version]`                      |       | 显示或设置版本；`-show commit\|version`     |
| `lang [zh\|en]`                          |       | 切换 CLI 语言                               |
| `config <get\|set\|point> [key] [value]` |       | 全局配置                                    |
| `publish`                                |       | 发布到 PMNX 市场（`-tag`, `-build skip\|enable`） |
| `unpublish <package>`                    |       | 从 PMNX 移除包                             |
| `install <package>`                      |       | 安装 PMNX 包                                |
| `uninstall <package>`                    |       | 移除 PMNX 包                                |
| `login [token]`                          |       | PMNX 市场认证                               |
| `profile`                                |       | 查看当前用户信息                            |
| `view <package>`                         |       | 查看包详情                                  |
| `log <point\|clean>`                     |       | 日志管理                                    |

## 其他语言 README

[English](./README.md)

## 相关仓库

[MCX Core](https://github.com/RuanhoR/mcx-core) · [MCX Language Server](https://github.com/RuanhoR/mcx-language-server) · [MCX Template](https://github.com/RuanhoR/mcx-template) · [MNX Market](https://github.com/RuanhoR/mnx)

## 文档

- [English Docs](https://mbler-docs.ruanhor.dpdns.org/)
- [中文文档](https://zh-mbler-docs.ruanhor.dpdns.org/)

## 发布平台

[GitHub](https://github.com/RuanhoR/mbler) · [Gitee](https://gitee.com/n304sc-haoran/mbler.git) · [npm](https://npmjs.com/package/mbler)

## 许可证

[MIT](LICENSE)
