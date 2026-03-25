# Versioning

The Deterministic Execution Layer (DEL) follows [Semantic Versioning (semver)](https://semver.org/) for all releases.

## Semantic versioning

Version numbers take the form `MAJOR.MINOR.PATCH`:

| Component | Increment when... | Example |
|-----------|------------------|---------|
| `MAJOR` | An incompatible API change is made | `1.0.0` → `2.0.0` |
| `MINOR` | Backwards-compatible functionality is added | `1.0.0` → `1.1.0` |
| `PATCH` | Backwards-compatible bug fixes are made | `1.0.0` → `1.0.1` |

### What counts as a breaking change (MAJOR)

- Removing or renaming an exported function, type, or constant from a public module
- Changing the shape of a Step's input or output schema in a way that rejects previously valid data
- Changing the behavior of an existing pipeline in a way that produces different outputs for the same inputs
- Changing the required environment variables or configuration schema
- Dropping support for a previously supported Node.js version

### What counts as a new feature (MINOR)

- Adding a new Tool, Pipeline, or Service
- Adding optional fields to an existing schema (with defaults)
- Adding new supported languages to a linter, formatter, or compiler
- Adding new environment variables (all optional with sensible defaults)

### What counts as a patch (PATCH)

- Bug fixes that restore documented behavior
- Performance improvements with no API changes
- Documentation updates
- Dependency updates that don't change behavior

## Pre-release versions

Pre-release versions use the suffix `-alpha.N`, `-beta.N`, or `-rc.N`:

| Suffix | Meaning |
|--------|---------|
| `1.2.0-alpha.1` | Early development, unstable API |
| `1.2.0-beta.1` | Feature-complete, may have known bugs |
| `1.2.0-rc.1` | Release candidate, expected to be stable |

## Release process

### 1. Update the version

Update the version number in `package.json`:

```bash
# Patch release
npm version patch

# Minor release
npm version minor

# Major release
npm version major

# Pre-release
npm version prerelease --preid=beta
```

`npm version` automatically updates `package.json`, creates a commit, and creates a git tag.

### 2. Update the changelog

DEL maintains a `CHANGELOG.md` at the project root. Follow the [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [1.2.0] - 2024-06-15

### Added
- TOML validator in `src/tools/validators/tomlValidator.ts`
- Rust compiler support in `src/tools/compilers/rustCompiler.ts`

### Fixed
- Queue retry delay calculation now starts at attempt 1 instead of 0

### Changed
- Default `queue.maxRetries` increased from 3 to 5
```

Categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

### 3. Push the tag

```bash
git push origin main --tags
```

### 4. Create a GitHub release

1. Go to the repository's **Releases** page.
2. Click **Draft a new release**.
3. Select the tag created by `npm version`.
4. Set the release title to the version number (e.g., `v1.2.0`).
5. Paste the changelog entries for this version into the release notes.
6. Publish the release.

CI automatically runs the full test suite on tag pushes. The release is marked as a draft until CI passes.

## Long-term support (LTS)

The `main` branch tracks the latest stable version. Security patches may be backported to the previous MAJOR version on a best-effort basis. Check the repository's GitHub Releases page for the currently supported versions.

## Node.js compatibility

DEL targets the current and previous Node.js LTS releases. The supported Node.js version range is declared in the `engines` field of `package.json`:

```json
{
  "engines": {
    "node": ">=20.0.0"
  }
}
```

Dropping support for a Node.js LTS version is a MAJOR version change.

## Dependency versioning

All dependencies are pinned via `pnpm-lock.yaml`. To update dependencies:

```bash
pnpm update --latest          # Update all to latest compatible version
pnpm audit                    # Check for known vulnerabilities
pnpm run test                 # Verify nothing broke
```

Dependency updates that introduce breaking changes in DEL's behavior must follow the semver rules above and be released as the appropriate version bump.
