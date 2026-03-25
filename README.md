# Deterministic Execution Layer (DEL)

A production-ready, enterprise-grade **Deterministic Execution Layer** for orchestrating complex, multi-step workflows with guaranteed reproducibility, full auditability, and extensive tooling support.

## Overview

DEL provides a unified platform for executing deterministic pipelines across coding, billing, CRM, media processing, and document management workflows. It is built with TypeScript, designed for Node.js 20+, and ships with a comprehensive set of services, tools, and pipeline steps.

## Features

- **Pipeline Orchestration** — Coding, billing, CRM, media, and document pipelines
- **Dependency Scheduling** — Topological task graphs with cycle detection
- **Queue System** — Event queue, task queue, retry queue with exponential backoff, dead letter queue
- **Storage** — AWS S3, Google Cloud Storage, and local filesystem adapters
- **Database** — PostgreSQL with connection pooling, transactions, vector store (pgvector), and migrations
- **Email** — SMTP sending, template rendering, queuing, and verification
- **Crypto** — AES-256-GCM encryption, bcrypt hashing, JWT signing
- **Scheduler** — Cron jobs, one-time tasks, recurring tasks
- **Tooling** — Linters, formatters, minifiers, converters, compilers, and bundlers for 10+ languages
- **Media Handling** — PDF, DOCX, images (Sharp), audio (ffmpeg), video processing
- **Structured Logging** — Winston-based with audit logs, event logs, and context propagation
- **Validation** — Zod schemas, JSON Schema, XML, CSV, YAML validators

## Quick Start

```bash
pnpm install
cp src/configs/env.example .env
pnpm run build
pnpm run test
```

## Project Structure

```
src/
├── configs/          # Configuration files
├── services/         # Core services (logger, database, queue, storage, email, scheduler, crypto)
├── tools/            # Utilities, validators, linters, formatters, minifiers, converters, compilers, bundlers
├── pipelines/        # Business pipelines (coding, billing, crm, media, documents)
├── helpers/          # Shared helper functions
├── templates/        # Email and document templates
└── tests/            # Unit tests
docker/               # Dockerfile and docker-compose
.github/workflows/    # CI/CD workflows
```

## Development

```bash
pnpm run typecheck   # Type-check without emitting
pnpm run lint        # ESLint
pnpm run format      # Prettier
pnpm run test        # Vitest
pnpm run build       # Compile TypeScript
```

## Docker

```bash
docker compose -f docker/docker-compose.yml up
```

## License

MIT
