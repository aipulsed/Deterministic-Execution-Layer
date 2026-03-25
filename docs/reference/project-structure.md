# Project Structure

This document provides a detailed breakdown of every directory and file in the Deterministic Execution Layer (DEL) repository.

## Top-level layout

```
Deterministic-Execution-Layer/
├── src/                    # All application source code
├── docs/                   # Documentation
├── docker/                 # Container definitions
├── .github/                # CI/CD workflows
├── package.json            # Root package manifest
├── pnpm-lock.yaml          # Dependency lockfile
├── tsconfig.json           # TypeScript compiler configuration
├── vitest.config.ts        # Test runner configuration
└── turbo.json              # Turborepo build pipeline (if using monorepo tooling)
```

## `src/` — Source code

### `src/index.ts`

Application entry point. Initializes services, registers pipelines, and starts the scheduler and queue dispatcher.

### `src/configs/` — Configuration

| File | Purpose |
|------|---------|
| `env.example` | Template for the `.env` file. Lists all required and optional environment variables with example values. Copy to `.env` and populate before running. |
| `defaultConfig.json` | Default application configuration: app metadata, database pool size, Redis settings, queue retry parameters, storage provider, email defaults, and logging level. |
| `loggingConfig.json` | Winston logger configuration: log level, output format, file transport settings (filename, rotation, max size), and exception handler configuration. |

### `src/services/` — Core services

Stateful, lifecycle-managed infrastructure components. Each subdirectory is a separate service module.

| Directory | Service | Key responsibilities |
|-----------|---------|-------------------|
| `logger/` | Logger | Winston-based structured logging, audit log emission, log rotation |
| `database/` | Database | PostgreSQL connection pool, query interface, transaction helper, pgvector, migrations |
| `queue/` | Queue | Event queue, task queue, retry queue, dead-letter queue (Redis-backed) |
| `storage/` | Storage | AWS S3, Google Cloud Storage, and local filesystem adapters behind a unified interface |
| `email/` | Email | SMTP sending via Nodemailer, template rendering, email queuing |
| `scheduler/` | Scheduler | Cron jobs, one-time tasks, recurring task management |
| `crypto/` | Crypto | AES-256-GCM encryption, bcrypt hashing, JWT signing and verification |

### `src/tools/` — Stateless utilities

Pure functions organized by tool category. No service dependencies.

| Directory | Category | Contents |
|-----------|----------|---------|
| `linters/` | Linting | ESLint, TSLint, pylint, golint, RuboCop, cpplint, Stylelint, HTMLHint, markdownlint, jsonlint |
| `formatters/` | Formatting | Prettier, HTML, CSS, JSON, XML, YAML, SQL, Markdown, code formatters |
| `minifiers/` | Minification | JS, TS, CSS, HTML, JSON, XML, SVG, WASM minifiers |
| `converters/` | Conversion | JSON↔CSV, JSON↔YAML, JSON↔XML, Markdown↔HTML, XLSX↔CSV, PDF↔text, text↔JSON |
| `compilers/` | Compilation | TypeScript, JavaScript, Python, Go, Rust, WASM, LESS, SASS compilers |
| `bundlers/` | Bundling | esbuild, Rollup, Webpack, Parcel bundlers |
| `validators/` | Validation | Zod (schemaValidator), JSON Schema, XML Schema, CSV, YAML, file validators |
| `media-handlers/` | Media processing | Sharp (images), ffmpeg (audio/video), pdf-parse (PDFs) |
| `utils/` | Utilities | Shared utility functions used by other tools |

### `src/pipelines/` — Business pipelines

Pipeline implementations organized by business domain.

| Directory | Domain | Pipelines |
|-----------|--------|---------|
| `coding/` | Coding | createProject, compileCode, lintCode, formatCode, runUnitTests, testCode, bundleCode, minifyCode, convertCode, resolveImports, analyzeDependencies, generateDocs |
| `billing/` | Billing | Payment processing, invoicing, subscription management |
| `crm/` | CRM | Customer records, contact management, lead processing |
| `media/` | Media | processPdf, processDocx, processMp3, processMp4, processWav, processTxt, optimizeImages, generateThumbnail, extractAudio, transcodeVideo |
| `documents/` | Documents | convertDocument, validateDocument, extractMetadata |

### `src/helpers/` — Shared helpers

| File | Purpose |
|------|---------|
| `errorHelpers.ts` | Error type guards, error formatting, and safe error extraction utilities |
| `templateHelpers.ts` | Template rendering helpers used by the email and documents services |
| `apiHelpers.ts` | HTTP request helpers (retry logic, response parsing, timeout handling) |
| `validationHelpers.ts` | Shared validation utilities used across multiple pipelines |

### `src/templates/` — Email and document templates

Template files used by the email service and document pipelines. Typically HTML (for email) or Markdown/text (for documents).

### `src/tests/` — Test suite

Tests are organized to mirror the source structure:

```
src/tests/
├── tools/
│   ├── validators.test.ts
│   ├── converters.test.ts
│   └── formatters.test.ts
├── services/
│   ├── queue.test.ts
│   ├── database.test.ts
│   └── crypto.test.ts
└── pipelines/
    ├── coding.test.ts
    ├── billing.test.ts
    ├── crm.test.ts
    ├── media.test.ts
    └── documents.test.ts
```

All tests are written with [Vitest](https://vitest.dev) and are run with `pnpm run test`.

### `src/types/` — Type declarations

| File | Purpose |
|------|---------|
| `pdf-parse.d.ts` | TypeScript declaration for the `pdf-parse` package (which lacks bundled types) |

## `docker/` — Container definitions

| File | Purpose |
|------|---------|
| `Dockerfile` | Multi-stage Docker image for the DEL application (build + production stages) |
| `docker-compose.yml` | Local development stack: DEL application + PostgreSQL + Redis |

## `.github/` — CI/CD

| Path | Purpose |
|------|---------|
| `.github/workflows/` | GitHub Actions workflow definitions for CI (lint, typecheck, test, build) and CD (deployment) |

## Root configuration files

| File | Purpose |
|------|---------|
| `package.json` | npm package manifest: scripts, dependencies, devDependencies |
| `pnpm-lock.yaml` | pnpm lockfile — pins all transitive dependency versions for reproducible installs |
| `tsconfig.json` | TypeScript compiler options: target (`ES2022`), module format, strict mode, path aliases |
| `vitest.config.ts` | Vitest configuration: test file globs, coverage settings, test environment |
| `turbo.json` | Turborepo pipeline configuration for build caching and task dependency ordering |
