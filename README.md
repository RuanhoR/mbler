# MBLER

[![CI](https://github.com/RuanhoR/mbler/actions/workflows/lint.yml/badge.svg)](https://github.com/RuanhoR/mbler/actions/workflows/lint.yml)
[![npm](https://img.shields.io/npm/v/mbler)](https://npmjs.com/package/mbler)
[![License](https://img.shields.io/github/license/RuanhoR/mbler)](LICENSE)
[![Node](https://img.shields.io/node/v/mbler)](https://nodejs.org)
[![Gitee](https://img.shields.io/badge/Gitee-mirror-red)](https://gitee.com/n304sc-haoran/mbler.git)

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
- **`mcx-tsc`** — Standalone MCX type-checker binary

## Installation

**Prerequisites:** Node.js >= 20.0.0, pnpm (recommended) or npm

```bash
npm install -g mbler
```

## Quick Start

```bash
# Initialize a new project
mbler init

# Build the addon
mbler build

# Build release .mcaddon package
BUILD_MODULE=release mbler build

# Watch for changes and rebuild
mbler watch

# Set working directory
mbler work ./my-addon
```

## CLI Commands

| Command | Alias | Description |
|---|---|---|
| `help [command]` | `h` | Show help for a command |
| `init [args...]` | | Initialize a project config file |
| `build` | | Build the addon (behavior + resources) |
| `watch` | | Watch mode with incremental rebuild |
| `work [path]` | `c` | Set or display the working directory |
| `set-work-dir <on\|off>` | | Enable/disable persistent working directory |
| `version [version]` | | Show or set version; `-show commit\|version` |
| `lang [zh\|en]` | | Switch CLI language |
| `config <get\|set\|point> [key] [value]` | | Global configuration |
| `publish` | | Publish to PMNX marketplace (`-tag`, `-build skip\|enable`) |
| `unpublish <package>` | | Remove a package from PMNX |
| `install <package>` | | Install a PMNX package |
| `uninstall <package>` | | Remove a PMNX package |
| `login [token]` | | Authenticate with PMNX marketplace |
| `profile` | | View current user profile |
| `view <package>` | | View package details |
| `log <point\|clean>` | | Log management |

## Configuration

Create a `mbler.config.js` in your project root:

```js
// @ts-check
import { defineConfig } from 'mbler'
export default defineConfig({
  name: 'my-addon',
  description: 'A custom Minecraft addon',
  version: '0.0.1',
  mcVersion: '1.21.120',
  script: {
    main: 'index.ts',
    lang: 'mcx',    // 'ts' | 'mcx' | 'js'
    ui: true,       // enable @minecraft/server-ui
  },
  minify: false,    // 'oxc' | 'terser' | 'esbuild'
  outdir: {
    behavior: './dist/dep',
    resources: './dist/res',
    dist: './dist.mcaddon',
  },
})
```

## Project Structure

```
mbler/
├── bin/                    # CLI entry points
│   ├── mbler.js            # Main CLI binary
│   └── mcx-tsc.js          # MCX type-checker
├── src/
│   ├── cli/                # Command definitions & dispatcher
│   ├── build/              # Build engine (Rolldown-based)
│   │   ├── manifest.ts     # manifest.json generator
│   │   ├── release.ts      # .mcaddon packaging
│   │   ├── cache.ts        # Incremental build cache
│   │   ├── minify.ts       # Minifier plugins
│   │   └── sapi.ts         # SAPI version resolver
│   ├── publisher/          # PMNX marketplace integration
│   ├── i18n/               # Internationalization (zh, en)
│   ├── uuid/               # Deterministic UUID generation
│   └── utils/              # Shared utilities
├── example/mbler-int/      # Example addon project
├── tests/                  # Test suite (Vitest)
├── dist/                   # Build output
└── package.json
```

## Related Repos

[MCX Core](https://github.com/RuanhoR/mcx-core) · [MCX Language Server](https://github.com/RuanhoR/mcx-language-server) · [MCX Template](https://github.com/RuanhoR/mcx-template) · [MNX Market](https://github.com/RuanhoR/mnx)

## Documentation

- [English Docs](https://mbler-docs.ruanhor.dpdns.org/)
- [中文文档](https://zh-mbler-docs.ruanhor.dpdns.org/)
- [한국어](./README_ko.md)
- [日本語](./README_ja.md)

## Release Platforms

[GitHub](https://github.com/RuanhoR/mbler) · [Gitee](https://gitee.com/n304sc-haoran/mbler.git) · [npm](https://npmjs.com/package/mbler)

## License

[MIT](LICENSE)