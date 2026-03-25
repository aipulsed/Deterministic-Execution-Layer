# Contributing to DEL

Thank you for contributing to the Deterministic Execution Layer (DEL). This document explains how to contribute, including the pull request process, code style, testing requirements, branch naming conventions, and commit message format.

## Before you start

1. Check the [open issues](https://github.com/your-org/Deterministic-Execution-Layer/issues) to see if your change is already being tracked.
2. For significant changes, open an issue first to discuss the approach before writing code.
3. For small fixes (typos, documentation, trivial bug fixes), a pull request without a prior issue is fine.

## Development setup

Follow the [Getting Started guide](../guides/getting-started.md) to set up your local development environment.

Quick summary:

```bash
pnpm install
cp src/configs/env.example .env
docker compose -f docker/docker-compose.yml up -d
pnpm run build
pnpm run test
```

## Branch naming

Use the following branch naming conventions:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feat/<short-description>` | `feat/add-rust-compiler` |
| Bug fix | `fix/<short-description>` | `fix/queue-retry-delay` |
| Documentation | `docs/<short-description>` | `docs/update-getting-started` |
| Refactor | `refactor/<short-description>` | `refactor/storage-adapter` |
| Test | `test/<short-description>` | `test/add-crypto-coverage` |
| Chore | `chore/<short-description>` | `chore/update-dependencies` |

Branch names use lowercase kebab-case only. No uppercase, no underscores.

## Commit conventions

DEL follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only changes |
| `style` | Formatting changes (no logic change) |
| `refactor` | Code restructure without feature or bug changes |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates, tooling |
| `perf` | Performance improvements |

### Scope (optional)

The scope should be the area of the codebase affected: `pipeline`, `service`, `tool`, `config`, `docs`, `queue`, `storage`, `crypto`, etc.

### Examples

```
feat(pipeline): add TOML validator to tools/validators
fix(queue): correct exponential backoff calculation on retry
docs: add adding-a-domain guide
chore: update esbuild to v0.21
test(crypto): add JWT expiry edge case coverage
```

### Commit body

For non-trivial changes, include a body that explains the _why_ (not the _what_ — the diff shows the what):

```
fix(queue): correct exponential backoff calculation on retry

The previous implementation used attempt count starting at 0,
causing the first retry to have zero delay. Changed to start
at 1 so the first retry delay equals the configured retryDelay.
```

## Code style

### TypeScript

- **Strict mode** — `tsconfig.json` enables `strict: true`. All TypeScript errors must be resolved before merging.
- **No `any`** — Use specific types or `unknown` with type narrowing. Disable `any` via ESLint's `@typescript-eslint/no-explicit-any` rule.
- **Zod for validation** — Use Zod for all data validation at domain boundaries. Do not use manual type assertions as a substitute.
- **Explicit return types** — Functions exported from modules must have explicit return types.
- **Named exports** — Prefer named exports over default exports for consistency.

### ESLint

Run the linter:

```bash
pnpm run lint
```

All ESLint errors must be resolved. Warnings should be addressed where practical. Do not disable ESLint rules without a comment explaining why.

### Prettier

Run the formatter:

```bash
pnpm run format
```

DEL uses Prettier for consistent formatting. The configuration is in `package.json` or `.prettierrc`. Do not manually adjust formatting — let Prettier handle it.

### File and directory naming

| Item | Convention | Example |
|------|-----------|---------|
| Source files | `camelCase.ts` | `csvValidator.ts` |
| Test files | `camelCase.test.ts` | `csvValidator.test.ts` |
| Config files | `camelCase.json` | `loggingConfig.json` |
| Directories | `camelCase` | `mediaHandlers/` |

## Testing requirements

DEL uses [Vitest](https://vitest.dev) for all tests.

### Running tests

```bash
pnpm run test           # Run all tests once
pnpm run test --watch   # Run in watch mode
```

### Requirements

- **All new features must have unit tests.** Coverage of the happy path and key error paths is required.
- **All bug fixes must include a regression test** that would have caught the bug.
- **Tests must pass before merging.** CI enforces this.
- **Mock service dependencies in unit tests.** Use `vi.mock()` to mock the service layer. Tests should not require a running database or Redis.

### Test structure

Tests mirror the source structure:

- Tool tests → `src/tests/tools/`
- Service tests → `src/tests/services/`
- Pipeline tests → `src/tests/pipelines/`

### Test naming

Use descriptive `describe` and `it` blocks:

```typescript
describe('csvValidator', () => {
  describe('when given valid CSV', () => {
    it('returns valid=true and parsed data', () => { ... });
  });

  describe('when given invalid CSV', () => {
    it('returns valid=false with descriptive errors', () => { ... });
  });
});
```

## Pull request process

1. **Fork** the repository and create a feature branch from `main`.
2. **Make your changes** following the code style and commit conventions above.
3. **Run all checks** locally before pushing:
   ```bash
   pnpm run typecheck
   pnpm run lint
   pnpm run test
   pnpm run build
   ```
4. **Push** your branch and open a pull request against `main`.
5. **Fill in the PR template** — describe what changed, why, and how to test it.
6. **Address review comments.** The PR requires at least one approving review before merge.
7. **Squash and merge** — use squash merge to keep the commit history clean. The PR title becomes the commit message (so write it as a Conventional Commit).

## What reviewers look for

- Correctness — does the code do what it claims?
- Tests — are there tests for new behavior and edge cases?
- Determinism — does the change preserve DEL's determinism guarantees?
- API compatibility — does the change break existing Step or Tool interfaces?
- Security — are secrets handled correctly? No hardcoded credentials?
- Documentation — is documentation updated for user-visible changes?
