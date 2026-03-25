# Core Concepts

This document defines the fundamental building blocks of the Deterministic Execution Layer (DEL) and explains how they relate to each other.

## Determinism

Determinism is the foundational guarantee of DEL: given the same inputs, configuration, code version, and dependency versions, a pipeline run will always produce the same outputs.

This is not a best-effort property — it is enforced structurally through explicit I/O contracts, controlled side effects, and stable serialization. See [Determinism and Reproducibility](determinism-and-reproducibility.md) for a deep dive.

## Pipeline

A **Pipeline** is the top-level unit of work in DEL. It represents a complete, named workflow composed of one or more Steps organized as a Directed Acyclic Graph (DAG).

Pipelines are defined in `src/pipelines/` and grouped by Domain. Each pipeline:

- Accepts a typed input payload
- Produces a typed output payload
- Declares its Steps and their dependencies
- Is registered with the scheduler or triggered directly

Examples: `compileCodingPipeline`, `processBillingPipeline`, `generateDocumentPipeline`.

## Step

A **Step** is a single unit of computation within a Pipeline. Each Step:

- Declares explicit inputs (consumed from prior Step outputs or the pipeline's initial payload)
- Declares explicit outputs (passed to downstream Steps)
- Is a pure function of its inputs given the same environment
- Can be retried independently of other Steps on transient failure

Steps are the nodes in the pipeline's DAG. Edges represent data dependencies between Steps.

## Task

A **Task** is the runtime instantiation of a Step within a specific pipeline run. When a pipeline is executed, each Step becomes a Task in the Task Queue. Tasks carry:

- The Step's implementation reference
- The resolved input data
- Retry metadata (attempt count, backoff delay)
- Run context (pipeline run ID, correlation ID, timestamp)

## DAG (Directed Acyclic Graph)

DEL models pipeline execution as a **DAG** where nodes are Steps and directed edges represent data dependencies (Step A must complete before Step B can start).

Properties enforced at registration time:

- **Acyclic** — DEL detects cycles during pipeline registration and raises an error before any execution begins.
- **Topologically ordered** — DEL uses topological sort to determine the execution order of Steps, maximizing parallelism while respecting dependencies.

## Topological Ordering

**Topological ordering** is the process of sequencing Steps such that every Step is executed only after all its dependencies have completed. DEL computes this order once at pipeline registration and uses it to schedule Tasks into the queue.

Steps with no mutual dependency can be executed in parallel.

## Domain

A **Domain** is a business-oriented grouping of related Pipelines. DEL ships with five built-in domains:

| Domain | Description |
|--------|-------------|
| `coding` | Code compilation, linting, testing, bundling, formatting |
| `billing` | Payment processing, invoice generation, subscription management |
| `crm` | Customer record management, contact workflows |
| `media` | PDF, DOCX, image, audio, and video processing |
| `documents` | Document conversion, validation, metadata extraction |

Domains live under `src/pipelines/<domain>/`. Each file in a domain directory implements one Pipeline or Step.

## Service

A **Service** is a shared infrastructure component used by Pipelines and Steps. Services are stateful and lifecycle-managed. DEL provides:

| Service | Role |
|---------|------|
| `logger` | Winston-based structured logging and audit trails |
| `database` | PostgreSQL with connection pooling, transactions, and pgvector |
| `queue` | Event queue, task queue, retry queue, and dead-letter queue |
| `storage` | AWS S3, Google Cloud Storage, and local filesystem adapters |
| `email` | SMTP sending, template rendering, queuing, and verification |
| `scheduler` | Cron jobs, one-time tasks, and recurring task management |
| `crypto` | AES-256-GCM encryption, bcrypt hashing, JWT signing and verification |

Services live under `src/services/`.

## Tool

A **Tool** is a stateless utility that performs a discrete transformation on data or code. Tools are organized by function category:

| Category | Examples |
|----------|---------|
| `linters` | ESLint, TSLint, pylint, golint, rubocop, cpplint, markdownlint, stylelint, htmlhint, jsonlint |
| `formatters` | Prettier, code/HTML/CSS/JSON/XML/YAML/SQL/Markdown formatters |
| `minifiers` | JS, TS, CSS, HTML, JSON, XML, SVG, WASM minifiers |
| `converters` | JSON↔CSV, JSON↔YAML, JSON↔XML, Markdown↔HTML, XLSX↔CSV, text↔PDF |
| `compilers` | TypeScript, JavaScript, Python, Go, Rust, WASM, LESS, SASS compilers |
| `bundlers` | esbuild, Rollup, Webpack, Parcel bundlers |
| `validators` | JSON Schema, Zod (via schemaValidator), XML Schema, CSV, YAML, file validators |
| `media-handlers` | Sharp (images), ffmpeg (audio/video), pdf-parse (PDFs) |

Tools live under `src/tools/` and are invoked by Steps. They have no side effects beyond their return value.

## Adapter

An **Adapter** is an implementation of a Service interface for a specific provider. For example, the `storage` service has three adapters: S3, GCS, and local filesystem. Adapters are selected at startup based on configuration and are transparent to the Steps that use them.

## Audit Log

An **Audit Log** is an immutable, append-only record of a pipeline run. Every Step execution writes an audit entry containing: run ID, step name, inputs, outputs, status, start time, end time, and any error information. Audit logs enable replay, debugging, and compliance.

## Dead Letter Queue (DLQ)

The **Dead Letter Queue** is a special queue that receives Tasks that have exhausted all retry attempts. DLQ entries are retained for inspection and manual reprocessing. The default TTL for DLQ entries is configurable (default: 86400 seconds / 24 hours).

## Schema

A **Schema** is a formal declaration of the shape and constraints of data flowing through a Step. DEL uses [Zod](https://zod.dev) as the primary schema library. Schemas serve three purposes:

1. **Input validation** — reject malformed payloads before execution begins
2. **Output validation** — verify Step outputs conform to expectations
3. **Documentation** — schemas are the authoritative definition of data contracts

## Idempotency

**Idempotency** means that running the same Step with the same inputs produces the same output and has no additional side effects on subsequent runs. DEL enforces idempotency through run-ID-keyed deduplication in the queue and by designing Steps to be naturally idempotent (upsert semantics, content-addressed storage keys, etc.).
