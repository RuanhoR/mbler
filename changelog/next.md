# Unreleased (since v0.2.7 / 2026-05-25)

This changelog tracks changes committed after the v0.2.7 release tag.

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
