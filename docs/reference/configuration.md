# Configuration Reference

This document covers all configuration options for the Deterministic Execution Layer (DEL), including environment variables and JSON configuration files.

## Environment variables (`.env`)

Copy `src/configs/env.example` to `.env` in the project root before running DEL:

```bash
cp src/configs/env.example .env
```

Environment variables take precedence over values in JSON configuration files.

### Core

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Runtime environment. Set to `production` in production deployments. Affects log level, error verbosity, and transport selection. |
| `PORT` | No | `3000` | HTTP port for the DEL API server. |

### Database

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | **Yes** | `postgresql://del:del@localhost:5432/del` | Full PostgreSQL connection string. Format: `postgresql://user:password@host:port/database`. |
| `DATABASE_POOL_SIZE` | No | `10` | Maximum number of open database connections in the connection pool. Increase for high-concurrency workloads. |

### Redis

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REDIS_URL` | **Yes** | `redis://localhost:6379` | Redis connection URL. Used for all queue operations. Format: `redis://[:password@]host:port[/db]`. |

### AWS S3 (required when `storage.provider = "s3"`)

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_ACCESS_KEY_ID` | Conditional | AWS IAM access key ID. Requires `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket` permissions on the target bucket. |
| `AWS_SECRET_ACCESS_KEY` | Conditional | AWS IAM secret access key corresponding to `AWS_ACCESS_KEY_ID`. |
| `AWS_REGION` | Conditional | AWS region where the S3 bucket is located (e.g., `us-east-1`). |
| `AWS_S3_BUCKET` | Conditional | Name of the S3 bucket used for DEL storage. |

### Google Cloud Storage (required when `storage.provider = "gcs"`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GCS_PROJECT_ID` | Conditional | GCP project ID associated with the GCS bucket. |
| `GCS_BUCKET` | Conditional | Name of the GCS bucket used for DEL storage. |

### Email (SMTP)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SMTP_HOST` | **Yes** (if email used) | `smtp.example.com` | Hostname of the SMTP server for sending transactional email. |
| `SMTP_PORT` | No | `587` | SMTP port. Use `587` for STARTTLS (recommended) or `465` for SSL. |
| `SMTP_USER` | **Yes** (if email used) | — | SMTP authentication username (usually an email address). |
| `SMTP_PASS` | **Yes** (if email used) | — | SMTP authentication password. |

### Cryptography

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | **Yes** | Secret key for signing JWTs (HS256). Must be a strong random string. **Change before deploying to production.** Minimum 32 characters recommended. |
| `ENCRYPTION_KEY` | **Yes** | 32-byte (256-bit) key for AES-256-GCM symmetric encryption. Must be exactly 32 bytes when UTF-8 encoded. **Change before deploying to production.** |

> **Security:** Never commit `.env` to version control. `.gitignore` excludes `.env` by default. Use a secrets manager (AWS Secrets Manager, GCP Secret Manager, HashiCorp Vault) in production.

---

## `src/configs/defaultConfig.json`

The `defaultConfig.json` file provides default values for application settings. Environment variables override these defaults.

```json
{
  "app": {
    "name": "Deterministic Execution Layer",
    "version": "1.0.0",
    "port": 3000,
    "env": "development"
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "del",
    "poolSize": 10,
    "ssl": false
  },
  "redis": {
    "host": "localhost",
    "port": 6379,
    "db": 0
  },
  "queue": {
    "maxRetries": 3,
    "retryDelay": 5000,
    "deadLetterTtl": 86400
  },
  "storage": {
    "provider": "local",
    "localPath": "./uploads",
    "maxFileSize": 104857600
  },
  "email": {
    "host": "smtp.example.com",
    "port": 587,
    "secure": false,
    "from": "noreply@example.com"
  },
  "logging": {
    "level": "info",
    "format": "json"
  }
}
```

### Field reference

#### `app`

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Application display name |
| `version` | string | Application version |
| `port` | number | Default HTTP port (overridden by `PORT` env var) |
| `env` | string | Default environment (overridden by `NODE_ENV`) |

#### `database`

| Field | Type | Description |
|-------|------|-------------|
| `host` | string | PostgreSQL host (used if `DATABASE_URL` is not set) |
| `port` | number | PostgreSQL port |
| `name` | string | Database name |
| `poolSize` | number | Connection pool size (overridden by `DATABASE_POOL_SIZE`) |
| `ssl` | boolean | Enable SSL for database connections |

#### `queue`

| Field | Type | Description |
|-------|------|-------------|
| `maxRetries` | number | Maximum number of retry attempts for a failed task (default: 3) |
| `retryDelay` | number | Base retry delay in milliseconds. Actual delay uses exponential backoff: `retryDelay × 2^(attempt-1)` |
| `deadLetterTtl` | number | TTL in seconds for Dead Letter Queue entries (default: 86400 = 24 hours) |

#### `storage`

| Field | Type | Description |
|-------|------|-------------|
| `provider` | string | Storage adapter: `"local"`, `"s3"`, or `"gcs"` |
| `localPath` | string | Local filesystem path for `"local"` provider (relative to project root) |
| `maxFileSize` | number | Maximum upload size in bytes (default: 104857600 = 100 MB) |

#### `email`

| Field | Type | Description |
|-------|------|-------------|
| `host` | string | SMTP host (overridden by `SMTP_HOST`) |
| `port` | number | SMTP port (overridden by `SMTP_PORT`) |
| `secure` | boolean | Use SSL for SMTP (true for port 465) |
| `from` | string | Default sender email address |

#### `logging`

| Field | Type | Description |
|-------|------|-------------|
| `level` | string | Minimum log level: `error`, `warn`, `info`, `http`, `debug` |
| `format` | string | Log format: `"json"` (machine-readable) or `"simple"` (human-readable) |

---

## `src/configs/loggingConfig.json`

Controls Winston logger configuration in detail.

| Field | Type | Description |
|-------|------|-------------|
| `level` | string | Global minimum log level |
| `format` | string | Output format (`json` or `simple`) |
| `transports[].type` | string | Transport type: `"console"` or `"file"` |
| `transports[].level` | string | Per-transport log level override |
| `transports[].colorize` | boolean | Colorize console output (development only) |
| `transports[].filename` | string | Log file path (for file transports) |
| `transports[].maxsize` | number | Maximum log file size in bytes before rotation (default: 5242880 = 5 MB) |
| `transports[].maxFiles` | number | Number of rotated files to retain (default: 5) |
| `exceptionHandlers[].filename` | string | File path for capturing unhandled exceptions |
