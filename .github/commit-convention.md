# Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) for automated changelog generation.

## Format

```
<type>(<scope>): <description>
```

### Types

| Type | Description |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Code style changes (formatting, etc.) |
| `refactor` | Code refactoring without feature or fix |
| `perf` | Performance improvements |
| `test` | Adding or updating tests |
| `build` | Build system or dependencies |
| `ci` | CI configuration changes |
| `chore` | Other changes (maintenance, etc.) |
| `types` | TypeScript type definition changes |
| `wip` | Work in progress |
| `release` | Release commit |
| `dx` | Developer experience improvements |

### Scope (optional)

The scope should be the area of the codebase affected (e.g., `cli`, `build`, `publisher`, `i18n`).

### Description

- Use the imperative, present tense (e.g., "add" not "added" nor "adds")
- Keep it under 50 characters
- Do not capitalize the first letter
- No dot (.) at the end

## Examples

```
feat(compiler): add 'comments' option
fix(v-model): handle events on blur (close #28)
docs: update installation guide
refactor(build): extract manifest generator
test(cache): add incremental build tests
```