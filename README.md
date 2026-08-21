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

A development toolchain for Minecraft Bedrock Edition Addons, built on [Rolldown](https://rolldown.rs).

## Features

- **MCX DSL** — Domain-specific language for Minecraft scripting with type safety
- **Manifest Generator** — Auto-generates `manifest.json` with deterministic UUIDs and module dependencies
- **Bundle** — Bundles scripts into single ESM files via Rolldown, with auto-externalization of Minecraft APIs
- **Component build** — Asset import support (`.png`, `.svg`, etc.) via MCX image components
- **Watch mode** — Incremental rebuild & file-copy on change via `mbler watch`
- **Minification** — Supports `oxc` (default), `terser`, and `esbuild` minifiers
- **Build cache** — Configurable caching (none/memory/file/filesystem/auto) for faster rebuilds
- **Release packaging** — Build `.mcaddon` archives via `BUILD_MODULE=release` environment variable
- **PMNX Marketplace** — Publish, install, uninstall, and manage addon packages
- **i18n** — Built-in internationalization (English & Chinese)

## Installation

**Prerequisites:** Node.js >= 20.0.0, pnpm (recommended) or npm

```bash
npm install -g mbler
```

## Quick Start

```bash
pnpm create mbler

pnpm build
```

## Example Project

[Bedwars Addon](https://github.com/RuanhoR/mcbe-bedwars-addon) | [RedStonePlugin Addon: Place, Cut](https://github.com/RuanhoR/mcbe-redstoneplugin-addon) | [Luckly Block Addon](https://github.com/RuanhoR/LuckBlock)

## CLI Commands

| Command                                  | Alias | Description                                                 |
| ---------------------------------------- | ----- | ----------------------------------------------------------- |
| `help [command]`                         | `h`   | Show help for a command                                     |
| `init [args...]`                         |       | Initialize a project config file                            |
| `build`                                  |       | Build the addon (behavior + resources)                      |
| `watch`                                  |       | Watch mode with incremental rebuild                         |
| `work [path]`                            | `c`   | Set or display the working directory                        |
| `set-work-dir <on\|off>`                 |       | Enable/disable persistent working directory                 |
| `version [version]`                      |       | Show or set version; `-show commit\|version`                |
| `lang [zh\|en]`                          |       | Switch CLI language                                         |
| `config <get\|set\|point> [key] [value]` |       | Global configuration                                        |
| `publish`                                |       | Publish to PMNX marketplace (`-tag`, `-build skip\|enable`) |
| `unpublish <package>`                    |       | Remove a package from PMNX                                  |
| `install <package>`                      |       | Install a PMNX package                                      |
| `uninstall <package>`                    |       | Remove a PMNX package                                       |
| `login [token]`                          |       | Authenticate with PMNX marketplace                          |
| `profile`                                |       | View current user profile                                   |
| `view <package>`                         |       | View package details                                        |
| `log <point\|clean>`                     |       | Log management                                              |

## Other Language README

[中文](./README_zh.md)

## Related Repos

[MCX Core](https://github.com/RuanhoR/mcx-core) · [MCX Language Server](https://github.com/RuanhoR/mcx-language-server) · [MCX Template](https://github.com/RuanhoR/mcx-template) · [MNX Market](https://github.com/RuanhoR/mnx)

## Documentation

- [English Docs](https://mbler-docs.ruanhor.dpdns.org/)
- [中文文档](https://zh-mbler-docs.ruanhor.dpdns.org/)

## Release Platforms

[GitHub](https://github.com/RuanhoR/mbler) · [Gitee](https://gitee.com/n304sc-haoran/mbler.git) · [npm](https://npmjs.com/package/mbler)

## License

[MIT](LICENSE)
