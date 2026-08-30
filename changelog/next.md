# Unreleased (since v0.3.0 / 2026-08-28)

This changelog tracks changes committed after the v0.3.0 release tag.

### 2026-08-29

- **feat(build)**: Inject fs into mcx-core (`c2b4e09`)

### 2026-08-30

- **feat(build)**: Full manifest config support — `manifest` section in `mbler.config.js` with `pack_scope`, `platform_locked`, `base_game_version`, `allow_random_seed`, `lock_template_options`, `capabilities` (merged with auto `script_eval`), pack/module dependencies, `subpacks`, `settings` (label/input/toggle/slider/dropdown) and `metadata` (auto-injected `generated_with`); exported enums `MblerPackScope`, `MblerManifestCapability`, `MblerManifestSettingType`, `MblerManifestProductType` (`d3f2939`)
- **refactor(build)**: Removed `build.outputDir` and `build.outputFilename` — script output is always written to `scripts/`, entry derived from `script.main` (always `scripts/index.js` for mcx) (`d3f2939`)
