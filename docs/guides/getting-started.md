# Getting Started

This guide walks you through setting up the Deterministic Execution Layer (DEL) on your local machine and running your first pipeline.

## Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Notes |
|------------|---------|-------|
| Node.js | 20.x or later | Required. DEL uses native Node.js 20 APIs. |
| pnpm | 8.x or later | Required. DEL uses pnpm workspaces. |
| PostgreSQL | 15.x or later | Required for the database service. Alternatively, use Docker (recommended). |
| Redis | 7.x or later | Required for the queue service. Alternatively, use Docker (recommended). |
| Docker | 24.x or later | Optional but strongly recommended for local development. |

### Installing Node.js 20

We recommend using [nvm](https://github.com/nvm-sh/nvm) or [fnm](https://github.com/Schniz/fnm) to manage Node.js versions:

```bash
# With nvm
nvm install 20
nvm use 20

# With fnm
fnm install 20
fnm use 20
```

### Installing pnpm

```bash
npm install -g pnpm
```

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/Deterministic-Execution-Layer.git
cd Deterministic-Execution-Layer
```

### 2. Install dependencies

```bash
pnpm install
```

This installs all workspace dependencies and is reproducible because the `pnpm-lock.yaml` file pins every dependency version.

### 3. Configure environment variables

Copy the example environment file and edit it with your local settings:

```bash
cp src/configs/env.example .env
```

Open `.env` and update at minimum:

```env
NODE_ENV=development
PORT=3000

# Database (use the Docker values if running via docker-compose)
DATABASE_URL=postgresql://del:del@localhost:5432/del

# Redis (use the Docker values if running via docker-compose)
REDIS_URL=redis://localhost:6379

# Crypto (generate strong random values for production)
JWT_SECRET=your-jwt-secret-change-in-production
ENCRYPTION_KEY=your-32-byte-encryption-key
```

For a full list of environment variables, see the [Configuration reference](../reference/configuration.md).

### 4. Start infrastructure (recommended: Docker)

The fastest way to get PostgreSQL and Redis running locally is with Docker Compose:

```bash
docker compose -f docker/docker-compose.yml up -d
```

This starts:
- PostgreSQL on port 5432 (user: `del`, password: `del`, database: `del`)
- Redis on port 6379

### 5. Build the project

```bash
pnpm run build
```

This compiles TypeScript to JavaScript in the `dist/` directory.

### 6. Run tests to verify

```bash
pnpm run test
```

All tests should pass. If they do not, check that your `.env` is configured correctly and that PostgreSQL and Redis are running.

## Your first pipeline run

Once the project is built, you can invoke a pipeline programmatically. Here is an example using the `coding` domain to lint a TypeScript file:

```typescript
import { lintCode } from './dist/pipelines/coding/lintCode.js';

const result = await lintCode({
  sourceCode: 'const x = 1\n',
  language: 'typescript',
});

console.log(result);
// { valid: true, warnings: ["Missing semicolon at line 1"], errors: [] }
```

## Quick verification checklist

- [ ] `pnpm install` completes without errors
- [ ] `pnpm run build` compiles with no TypeScript errors
- [ ] `pnpm run typecheck` reports no type errors
- [ ] `pnpm run lint` reports no linting violations
- [ ] `pnpm run test` — all tests pass

## Next steps

- [Running Locally](running-locally.md) — Docker setup, environment variables, and development workflow
- [Adding a Pipeline](adding-a-pipeline.md) — create your first custom pipeline
- [Architecture Overview](../architecture/overview.md) — understand the DEL architecture
