# Services

The Deterministic Execution Layer (DEL) provides a set of core services under `src/services/`. Services are shared infrastructure components used by Pipelines, Steps, and the DEL runtime itself. They are stateful, lifecycle-managed, and accessed through dependency injection.

## Logger (`src/services/logger/`)

The logger service provides structured, leveled logging backed by [Winston](https://github.com/winstonjs/winston).

### Features

- **Log levels:** `error`, `warn`, `info`, `http`, `debug` (configurable)
- **Structured JSON output** for machine parsing in production
- **Console transport** with colorized output for local development
- **File transports:**
  - `logs/app.log` — all `info`-level and above entries (max 5 MB, 5 rotated files)
  - `logs/error.log` — `error`-level entries only
  - `logs/exceptions.log` — unhandled exceptions
- **Audit log support** — dedicated log entries for pipeline step executions, capturing inputs, outputs, status, and duration
- **Context propagation** — correlation IDs and pipeline run IDs are attached to every log entry within a run

### Configuration

Logging behavior is controlled by `src/configs/loggingConfig.json`. The default level is `info` in production and `debug` in development (`NODE_ENV=development`).

---

## Database (`src/services/database/`)

The database service provides access to **PostgreSQL** with connection pooling, transaction management, vector storage, and schema migrations.

### Features

- **Connection pooling** — pool size configurable via `DATABASE_POOL_SIZE` (default: 10)
- **Transactions** — supports ACID transactions for multi-step database operations
- **pgvector extension** — enables vector similarity search for AI/ML workloads and embedding storage
- **Migrations** — schema migrations are managed as versioned SQL scripts, applied at startup

### Connection

Configured via `DATABASE_URL` environment variable:

```
DATABASE_URL=postgresql://del:del@localhost:5432/del
```

### Usage pattern

The database service exposes a query interface and a transaction helper:

```typescript
import { db } from '../../services/database';

// Single query
const result = await db.query('SELECT * FROM runs WHERE id = $1', [runId]);

// Transaction
await db.transaction(async (client) => {
  await client.query('INSERT INTO runs ...', [...]);
  await client.query('INSERT INTO steps ...', [...]);
});
```

---

## Queue (`src/services/queue/`)

The queue service manages the multi-queue system that drives pipeline execution. All queues are backed by **Redis**.

### Queue types

| Queue | Role |
|-------|------|
| **Event Queue** | Receives external triggers (webhooks, scheduled ticks) that initiate pipeline runs |
| **Task Queue** | Holds individual Step executions ready to be dispatched to workers |
| **Retry Queue** | Holds failed Tasks awaiting their backoff delay before re-queuing to the Task Queue |
| **Dead Letter Queue (DLQ)** | Holds Tasks that have exhausted all retry attempts; retained for inspection and manual reprocessing |

### Configuration

Retry behavior is configured via `src/configs/defaultConfig.json`:

| Parameter | Default |
|-----------|---------|
| `queue.maxRetries` | `3` |
| `queue.retryDelay` | `5000` ms |
| `queue.deadLetterTtl` | `86400` s (24 hours) |

### Connection

Configured via `REDIS_URL`:

```
REDIS_URL=redis://localhost:6379
```

### Visibility and deduplication

Tasks are uniquely identified by a `(runId, stepName)` composite key. The queue service enforces deduplication — if an identical Task is already in the queue or has completed successfully, re-enqueue requests are silently ignored.

---

## Storage (`src/services/storage/`)

The storage service provides a unified interface for object storage with three pluggable adapters.

### Adapters

| Adapter | Provider | Configuration |
|---------|---------|--------------|
| S3 | AWS S3 | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET` |
| GCS | Google Cloud Storage | `GCS_PROJECT_ID`, `GCS_BUCKET` |
| Local | Local filesystem | `storage.localPath` in `defaultConfig.json` (default: `./uploads`) |

The active adapter is selected by `storage.provider` in `defaultConfig.json` (`"s3"`, `"gcs"`, or `"local"`).

### Interface

All adapters implement the same interface:

```typescript
interface StorageAdapter {
  upload(key: string, content: Buffer, contentType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  listKeys(prefix: string): Promise<string[]>;
}
```

### Content-addressed keys

For deterministic storage, Steps should use content-addressed keys (e.g., SHA-256 hash of content) to ensure that uploading the same content twice is idempotent.

---

## Email (`src/services/email/`)

The email service handles transactional email sending via SMTP.

### Features

- **SMTP sending** via Nodemailer
- **Template rendering** — integrates with `src/templates/` for HTML email templates
- **Email queuing** — emails are enqueued via the task queue, not sent synchronously, so pipeline Steps do not block on email delivery
- **Delivery verification** — the service tracks sent email status

### Configuration

| Variable | Description |
|----------|-------------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (typically 587 for STARTTLS, 465 for SSL) |
| `SMTP_USER` | SMTP authentication username |
| `SMTP_PASS` | SMTP authentication password |

---

## Scheduler (`src/services/scheduler/`)

The scheduler service manages time-based pipeline triggering.

### Features

- **Cron jobs** — trigger pipelines on a cron schedule (e.g., `0 0 * * *` for daily at midnight)
- **One-time tasks** — schedule a pipeline to run once at a specific future time
- **Recurring tasks** — schedule tasks at a fixed interval (e.g., every 5 minutes)

Scheduled triggers enqueue an event in the Event Queue, which the pipeline dispatcher picks up and converts to a pipeline run.

### Usage

```typescript
import { scheduler } from '../../services/scheduler';

// Run a pipeline every day at midnight UTC
scheduler.cron('0 0 * * *', () => triggerPipeline('generateDailyReport', {}));

// Run once in 30 minutes
scheduler.once(30 * 60 * 1000, () => triggerPipeline('sendWelcomeEmail', { userId }));
```

---

## Crypto (`src/services/crypto/`)

The crypto service provides cryptographic primitives for data protection.

### Features

| Primitive | Algorithm | Use case |
|-----------|---------|---------|
| Symmetric encryption | AES-256-GCM | Encrypting sensitive data at rest (payment tokens, PII) |
| Password hashing | bcrypt | Hashing user passwords before database storage |
| JWT signing & verification | HS256 / RS256 | Issuing and validating API tokens |

### Configuration

| Variable | Description |
|----------|-------------|
| `ENCRYPTION_KEY` | 32-byte key for AES-256-GCM (must be exactly 32 bytes) |
| `JWT_SECRET` | Secret for JWT signing (HS256). Use a strong random value in production |

### Security notes

- `ENCRYPTION_KEY` and `JWT_SECRET` must never be committed to source control. Store them in environment variables or a secrets manager.
- AES-256-GCM provides authenticated encryption — it detects tampering as well as ensuring confidentiality.
- bcrypt work factor (cost) should be tuned to the server's CPU to keep password hashing at ~100–300 ms per hash.

See [Security](../governance/security.md) for full secrets management guidance.
