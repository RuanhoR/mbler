# Unreleased (since v0.3.0 / 2026-08-28)

This changelog tracks changes committed after the v0.3.0 release tag.

### 2026-10-25

- **chore(deps)**: Require `@mbler/mcx-core` >=1.1.5-rc.4 — mcx script errors (parse, traversal and TS syntax errors) are now reported at their original `.mcx` positions instead of positions inside the TS-transpiled output; the LucklyBlock trailing `luckBlock.` case reports `[ts error]: Identifier expected.` at `blocks.mcx:26:10` (`fd6ae95` in mcx-core)
- **chore(release)**: Bump 0.3.1-rc.2

### 2026-08-29

- **feat(build)**: Inject fs into mcx-core (`c2b4e09`)

### 2026-08-30

- **feat(build)**: Full manifest config support — `manifest` section in `mbler.config.js` with `pack_scope`, `platform_locked`, `base_game_version`, `allow_random_seed`, `lock_template_options`, `capabilities` (merged with auto `script_eval`), pack/module dependencies, `subpacks`, `settings` (label/input/toggle/slider/dropdown) and `metadata` (auto-injected `generated_with`); exported enums `MblerPackScope`, `MblerManifestCapability`, `MblerManifestSettingType`, `MblerManifestProductType` (`d3f2939`)
- **refactor(build)**: Removed `build.outputDir` and `build.outputFilename` — script output is always written to `scripts/`, entry derived from `script.main` (always `scripts/index.js` for mcx) (`d3f2939`)
- **fix(cli)**: Sanitized `uninstall` package id against path traversal; shared `sanitizeFileName` helper now also used by `install` (`e016b5b`)
- **fix**: Added fetch timeouts (30s, 120s for downloads/uploads) across sapi and publisher network calls (`e016b5b`)
- **fix**: Global config file now written with 0600 permissions; persistent state moved from the shared temp dir to the per-user data dir (`%LOCALAPPDATA%\mbler` on Windows, `~/Library/Caches/mbler` on macOS, `~/.cache/mbler` on Linux); publish release zip uses a unique per-run directory and is cleaned up after upload (`e016b5b`)

### 2026-08-31

- **refactor(build)**: Dropped `require()` calls in favor of static ESM imports; added `rm-old-dist` rolldown plugin that clears stale dist output before builds (`a361217`)
- **fix**: Removed unused config (`fb55e5d`)
- **docs**: Added dev WebSocket server and build cache intro to README/README_zh (`7c855a3`)

### 2026-09-05

- **feat(build)**: Added tests for no-bundle mode (`bf195f7`)
- **fix(cli)**: Resolved option aliases to long names (`a7c6666`)

### 2026-09-06

- **chore(release)**: Bump 0.3.1-rc.1 (`c4f95f8`)
