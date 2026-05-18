# Contributing to mbler

Thank you for your interest in contributing to mbler!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/mbler.git
   cd mbler
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Build the project:
   ```bash
   pnpm build
   ```

## Development

- Source code is in `src/`
- Test Data shoudn't push repo
- We use pnpm as the package manager

### Code Style

- TypeScript with strict mode
- Follow the existing code conventions in the project
- Prettier is configured (`.prettierrc`) — run `pnpm format` if available
- ESLint is configured — run `pnpm lint` to check

## Pull Request Process

1. Create a feature branch from `master`
2. Make your changes
3. Run tests to ensure nothing is broken
4. Keep changes focused — one feature/fix per PR
5. Write clear commit messages
6. Open a PR against the `master` branch

## Commit Conventions

We use conventional commits:

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `refactor:` — code refactoring
- `chore:` — maintenance tasks

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
