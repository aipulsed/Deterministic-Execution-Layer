# Glossary

This glossary defines key terms and concepts used throughout the Deterministic Execution Layer (DEL) documentation and codebase.

---

## A

### Adapter
An implementation of a Service interface for a specific provider. For example, the `storage` service has three adapters: AWS S3, Google Cloud Storage, and local filesystem. Adapters are selected at startup based on configuration and are transparent to Steps that use them. See [Services](../architecture/services.md).

### Audit Log
An immutable, append-only record of a pipeline run. Every Step execution writes an audit entry containing: run ID, step name, inputs, outputs, status, start time, end time, and any error information. Audit logs enable replay, debugging, and compliance.

### Autofix
The practice of automatically correcting certain classes of validation failure before returning an error. DEL implements autofix at the tool level — formatters can be composed with validators to validate-then-fix. See [Validation and Autofix](../architecture/validation-and-autofix.md).

---

## B

### Backoff
See **Exponential Backoff**.

### Bundler
A tool that combines multiple source files and their dependencies into a single output file. DEL supports esbuild, Rollup, Webpack, and Parcel bundlers. See [Tooling and Macro Tools](../architecture/tooling-and-macro-tools.md).

---

## C

### Compiler
A tool that transforms source code into a compiled artifact. DEL supports compilers for TypeScript, JavaScript, Python, Go, Rust, WASM, LESS, and SASS. See [Tooling and Macro Tools](../architecture/tooling-and-macro-tools.md).

### Converter
A tool that transforms data from one format to another. Examples: JSON↔CSV, Markdown↔HTML, PDF→text. See [Tooling and Macro Tools](../architecture/tooling-and-macro-tools.md).

### Correlation ID
A unique identifier attached to all log entries and audit records within a single request or pipeline run. Enables tracing a complete execution across multiple services, steps, and log files.

### Cycle Detection
The process of identifying circular dependencies in a Pipeline's DAG. DEL runs cycle detection at pipeline registration time using depth-first search. A cycle causes pipeline registration to fail with an error identifying the Steps involved. See [Pipelines](../architecture/pipelines.md).

---

## D

### DAG (Directed Acyclic Graph)
A graph where nodes have directed edges and no cycles are permitted. DEL models pipeline execution as a DAG where nodes are Steps and edges represent data dependencies. The absence of cycles ensures that every Step can eventually be executed. See [Pipelines](../architecture/pipelines.md).

### Dead Letter Queue (DLQ)
A special queue that receives Tasks that have exhausted all retry attempts. DLQ entries are retained for a configurable TTL (default: 24 hours) for manual inspection and reprocessing. See [Pipelines](../architecture/pipelines.md).

### DEL
**Deterministic Execution Layer**. A deterministic workflow and pipeline execution platform built with TypeScript. DEL provides reproducible pipeline execution, scheduling, queueing, validation, and tooling for multi-step jobs. See [Architecture Overview](../architecture/overview.md).

### Dependency Scheduling
The process of determining when each Step in a Pipeline can begin execution, based on the completion of its declared dependencies. DEL uses topological ordering to compute a valid execution schedule. See [Pipelines](../architecture/pipelines.md).

### Determinism
The guarantee that, given the same inputs, configuration, code version, and dependency versions, a pipeline run will always produce the same outputs. DEL achieves determinism through explicit I/O contracts, controlled side effects, stable serialization, and auditable execution records. See [Determinism and Reproducibility](../architecture/determinism-and-reproducibility.md).

### Domain
A business-oriented grouping of related Pipelines. DEL ships with five built-in domains: coding, billing, CRM, media, and documents. Domains live under `src/pipelines/<domain>/`. See [Domains](../architecture/domains.md).

---

## E

### Event Queue
The queue that receives external triggers (webhooks, schedule ticks) that initiate pipeline runs. Part of DEL's multi-queue architecture. See [Services](../architecture/services.md).

### Exponential Backoff
A retry delay strategy where each subsequent retry waits twice as long as the previous one. DEL uses exponential backoff with jitter for task retries: `delay = retryDelay × 2^(attempt-1) + jitter`. See [Pipelines](../architecture/pipelines.md).

---

## F

### Formatter
A tool that rewrites source code or structured data to conform to a consistent style. Formatters are idempotent: formatting already-formatted content returns the same content. See [Tooling and Macro Tools](../architecture/tooling-and-macro-tools.md).

---

## I

### Idempotency
The property that running a Step multiple times with the same inputs has the same effect as running it once. DEL enforces idempotency through run-ID-keyed deduplication and upsert semantics. See [Determinism and Reproducibility](../architecture/determinism-and-reproducibility.md).

---

## J

### JWT (JSON Web Token)
A compact, URL-safe token format used for API authentication in DEL. JWTs are signed using the `JWT_SECRET` environment variable (HS256 algorithm). The crypto service handles JWT signing and verification.

---

## L

### Linter
A tool that analyzes source code or data for style violations and potential errors without executing the code. DEL supports linters for JavaScript, TypeScript, Python, Go, Ruby, C++, CSS, HTML, Markdown, and JSON. See [Tooling and Macro Tools](../architecture/tooling-and-macro-tools.md).

---

## M

### Minifier
A tool that reduces file size by removing whitespace, comments, and other non-semantic content. DEL supports minifiers for JS, TS, CSS, HTML, JSON, XML, SVG, and WASM. See [Tooling and Macro Tools](../architecture/tooling-and-macro-tools.md).

---

## P

### Pipeline
The top-level unit of work in DEL. A named, typed workflow composed of one or more Steps organized as a DAG. Pipelines are defined in `src/pipelines/` and grouped by Domain. See [Core Concepts](../architecture/core-concepts.md).

### pgvector
A PostgreSQL extension that enables vector similarity search. Used in DEL's database service for AI/ML workloads and embedding storage.

---

## R

### Retry Queue
The queue that holds failed Tasks awaiting their next retry attempt. The retry delay is enforced in this queue before the Task is re-added to the Task Queue. See [Services](../architecture/services.md).

### Run ID
A unique identifier for a specific execution of a Pipeline. Used to correlate all Steps, Tasks, log entries, and audit records belonging to the same run. Stored in the database for long-term retrieval.

---

## S

### Schema
A formal declaration of the shape and constraints of data flowing through a Step. DEL uses Zod as the primary schema library. See [Core Concepts](../architecture/core-concepts.md).

### Service
A shared infrastructure component used by Pipelines and Steps. Services are stateful and lifecycle-managed. DEL provides: logger, database, queue, storage, email, scheduler, and crypto. See [Services](../architecture/services.md).

### Step
A single unit of computation within a Pipeline. Each Step declares explicit inputs and outputs and is a pure function of its inputs given the same environment. Steps are the nodes in the pipeline's DAG. See [Core Concepts](../architecture/core-concepts.md).

---

## T

### Task
The runtime instantiation of a Step within a specific pipeline run. Tasks carry the Step implementation reference, resolved input data, retry metadata, and run context. Tasks are managed by the task queue. See [Core Concepts](../architecture/core-concepts.md).

### Task Queue
The queue that holds individual Step executions ready to be dispatched to workers. Part of DEL's multi-queue architecture. See [Services](../architecture/services.md).

### Tool
A stateless utility that performs a discrete transformation on data or code. Tools live under `src/tools/` and are organized by function category. They have no side effects beyond their return value. See [Core Concepts](../architecture/core-concepts.md).

### Topological Order
A linear ordering of Steps in a DAG such that every Step appears after all of its dependencies. DEL computes the topological order at pipeline registration using Kahn's algorithm and uses it to schedule Tasks. See [Pipelines](../architecture/pipelines.md).

---

## V

### Validator
A tool that checks that data conforms to a declared schema or format and returns a structured result with pass/fail status and a list of errors. DEL supports Zod, JSON Schema, XML Schema, CSV, YAML, and file validators. See [Tooling and Macro Tools](../architecture/tooling-and-macro-tools.md).

### Vector Store
The pgvector-enabled capability of the database service that stores and queries high-dimensional embedding vectors. Used for AI/ML integrations such as semantic search and similarity matching.

---

## W

### Worker
A process or thread that dequeues a Task from the Task Queue and executes it. The number of concurrent workers is bounded by the configured pool size.

### Winston
The structured logging library used by DEL's logger service. Winston supports multiple transports (console, file), log levels, and JSON-formatted output. See [Services](../architecture/services.md).
