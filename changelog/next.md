# Unreleased (since v0.2.8 / 2026-06-21)

This changelog tracks changes committed after the v0.2.8 release tag.

### 2026-05-31

- **fix**: Updated version and dependencies; enhanced build configuration (`5d89b1b`)
- **chore**: Fixed `package.json` name typo and `pnpm-workspace.yaml` config (`5f81315`)

### 2026-06-08

- **fix**: Corrected spelling errors across the codebase — `FileExsit`→`FileExist`, `invaild`→`invalid`, `isVaildVersion`→`isValidVersion` (`8189ea1`)
- **refactor**: Replaced readme search loop with `findReadme` utility (`a6006ee`)
- **fix**: Corrected `behaivor`→`behavior` typo in error message (`5e6592f`)
- **test**: Migrated tests to Vitest with GitHub CI — added Vitest config with 17 utility/i18n tests; updated CI workflow; removed old `__test__/` harness (`6ced579`)
- **ci**: Generate `version.ts` before tests via pretest script (`7a7d0cb`)
- **ci**: Fix `simple-git-hooks` config for CI (add config path and allowed builds) (`e5cf96a`)

### 2026-06-09

- **fix**: Remove non-existent ESLint rule; set `engines.node>=20`; remove npm lockfile (`9172f98`)
- **fix**: Remove unused `content` variable; move chalk compat to shared utils; remove `console.log`; add `await` to `tryMkdir` (`82aba9e`)
- **chore**: Added ISSUE_TEMPLATE and `changelog/` directory with version history (`39b1d04`)
- **chore**: Added CODE_OF_CONDUCT.md (Contributor Covenant v2.1) (`e158e00`)

### 2026-06-10

- **chore**: Moved template to `create-mbler` package (`b4704c2`)
- **chore**: Migrated from Rollup to Rolldown — ~9s → ~0.3s JS bundle builds; removed rollup + related plugins; added `rolldown-plugin-dts` (`703e867`)

### 2026-06-12

- **feat**: Added `build.clean` option to delete `dist/` before build (`eedf7f7`)

### 2026-06-13

- **feat(build cli)**: Print 'success at `<num>s`' on build end (`57288dc`)
- **fix(plugin-mcx-tsc)**: Added image extensions to `extraSupportedExtensions` (`2c2775c`)
- **chore**: Bumped version to v0.2.7-rc.3; updated `@mbler/mcx-server` dep (`0f79539`)
- **chore**: Removed dev link dependency (`6eba01b`)
- **test**: Added tests for `sapiVersion` and enhanced `utils.spec.ts` (`f30a214`)
- **chore**: Updated `@mbler/mcx-server` dep to v0.1.1-rc.1 (`53a3a7e`)
- **fix**: Fixed null build release (`03de873`)
- **style**: Batch formatted code with Prettier (`e63391a`)
- **refactor(cli)**: Added declarative command framework with typed params — `CommandDef`, `parseArgs`, `parseRawParams`; refactored CLI dispatcher and all 11 command handlers; added 63 new tests (`85f665d`)

### 2026-06-14

- **refactor**: Replaced chalk with `styleText` from `node:util` in build and utils; removed `npm-registry-fetch` from SAPI module (`b232377`)

### 2026-06-20

- **ci**: Fixed unused import (`fd24a06`)
- **refactor**: Replaced `@rollup/plugin-terser` with custom minify plugins (oxc/terser/esbuild) (`f8f06b7`)
- **fix**: Improved `sapi.ts` — fixed version comparison, added fetch retry, removed `_v` hack, improved types and error messages (`e3187a9`)
- **feat**: Added `displayName` field for manifest `header.name` (`08e6da9`)
- **feat**: Added validation to ensure name consistency between `mbler.config.js` and `package.json` (`5220017`)

### 2026-06-21 — 2026-06-27

- **test**: Increased coverage to ~68% with 39 test files and 204 tests; added coverage/ to .gitignore (`a025f7d`, `4af1ee2`, `568678f`)
- **test**: Enhanced test coverage and improved mocking in various test files (`4af1ee2`)
- **chore**: Updated LICENSE (`d378103`)
- **refactor**: Updated Build constructor to accept `MblerConfigData` and streamlined config loading (`4b03f23`)
- **fix**: Cross-platform compatibility — forward slash normalization for dynamic `import()` on Windows, `shell: true` for spawn on Windows (`1baf950`, `16d7601`)
- **chore**: Updated dependencies — `@mbler/mcx-core` to 0.1.2-rc.8/rc.9, `@mbler/mcx` to 0.0.4-rc.1, `@mbler/mcx-types` to 0.0.4-rc.2 (`b9e6935`, `ea289dc`)

### 2026-06-28

- **chore**: Updated `@mbler/mcx` to 0.0.4-rc.1, `@mbler/mcx-core` to 0.1.2-rc.9, `@mbler/mcx-types` to 0.0.4-rc.2; published mbler@0.2.8-rc.4 (`ea289dc`)
