# Running Locally

This guide covers the full local development workflow for the Deterministic Execution Layer (DEL), including Docker setup, environment variables, development commands, and debugging tips.

## Docker setup

The recommended way to run DEL locally is with Docker Compose. The `docker/docker-compose.yml` file defines all required infrastructure services.

### Start all services

```bash
docker compose -f docker/docker-compose.yml up
```

To run in the background (detached):

```bash
docker compose -f docker/docker-compose.yml up -d
```

### Stop all services

```bash
docker compose -f docker/docker-compose.yml down
```

To stop and remove volumes (wipes all database and Redis data):

```bash
docker compose -f docker/docker-compose.yml down -v
```

### What Docker Compose starts

| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 5432 | user: `del`, password: `del`, db: `del` |
| Redis | 6379 | No authentication in development |

### Running the DEL application in Docker

The `docker/` directory also contains a `Dockerfile` for containerizing the DEL application itself. To build and run the full stack:

```bash
docker compose -f docker/docker-compose.yml up --build
```

## Environment variables

DEL uses a `.env` file for local development. Copy the example and edit:

```bash
cp src/configs/env.example .env
```

### Core variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `3000` | HTTP port for the DEL API server |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://del:del@localhost:5432/del` | Full PostgreSQL connection string |
| `DATABASE_POOL_SIZE` | `10` | Maximum number of database connections in the pool |

### Redis

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |

### AWS S3 (optional)

| Variable | Description |
|----------|-------------|
| `AWS_ACCESS_KEY_ID` | AWS access key for S3 access |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key |
| `AWS_REGION` | AWS region (e.g., `us-east-1`) |
| `AWS_S3_BUCKET` | S3 bucket name for DEL storage |

### Google Cloud Storage (optional)

| Variable | Description |
|----------|-------------|
| `GCS_PROJECT_ID` | GCP project ID |
| `GCS_BUCKET` | GCS bucket name |

### Email (SMTP)

| Variable | Default | Description |
|----------|---------|-------------|
| `SMTP_HOST` | `smtp.example.com` | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |

### Cryptography

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for JWT signing. Must be changed in production. |
| `ENCRYPTION_KEY` | 32-byte key for AES-256-GCM encryption. Must be changed in production. |

> **Security note:** Never commit `.env` to version control. The `.gitignore` file excludes `.env` by default.

## Development commands

All development commands are defined in `package.json` and run with `pnpm run <command>`.

| Command | Description |
|---------|-------------|
| `pnpm run build` | Compile TypeScript to JavaScript (`dist/`) |
| `pnpm run typecheck` | Run `tsc --noEmit` to check types without emitting output |
| `pnpm run lint` | Run ESLint on all TypeScript source files |
| `pnpm run format` | Run Prettier to format all source files |
| `pnpm run test` | Run all tests with Vitest |
| `pnpm run test --watch` | Run tests in watch mode (re-runs on file changes) |

### Recommended development workflow

1. Start infrastructure: `docker compose -f docker/docker-compose.yml up -d`
2. Install dependencies: `pnpm install`
3. Start the TypeScript compiler in watch mode: `pnpm run build --watch` (or use your IDE's TypeScript integration)
4. Run tests in watch mode in a separate terminal: `pnpm run test --watch`
5. Make changes; tests and type checks update automatically

## Debugging

### Structured logs

In development (`NODE_ENV=development`), the logger outputs colorized, human-readable logs to the console. Set the log level to `debug` for verbose output:

```env
NODE_ENV=development
```

Log files are written to `logs/`:
- `logs/app.log` — all `info`-level and above
- `logs/error.log` — errors only
- `logs/exceptions.log` — unhandled exceptions

### Debugging TypeScript with Node.js

To debug with the Node.js inspector:

```bash
node --inspect dist/index.js
```

Then open `chrome://inspect` in Chrome or attach your IDE debugger to port 9229.

### Common issues

**`DATABASE_URL` connection refused**
Ensure PostgreSQL is running: `docker compose -f docker/docker-compose.yml up -d`

**`REDIS_URL` connection refused**
Ensure Redis is running: `docker compose -f docker/docker-compose.yml up -d`

**TypeScript compilation errors after `pnpm install`**
Run `pnpm run typecheck` to see all type errors. Ensure you are using Node.js 20.

**Tests fail with timeout errors**
Increase the Vitest timeout in `vitest.config.ts` or ensure that all infrastructure services are running and accessible.
