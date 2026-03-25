# Determinism and Reproducibility

This document provides a deep dive into how the Deterministic Execution Layer (DEL) achieves and maintains deterministic execution — the guarantee that, given the same inputs and environment, a pipeline run will always produce the same outputs.

## Why determinism matters

Non-deterministic execution leads to:

- **Irreproducible bugs** — failures that cannot be replicated or diagnosed
- **Audit gaps** — inability to prove what happened in a past run
- **Flaky pipelines** — intermittent failures caused by race conditions, time-dependent logic, or random behavior
- **Compliance risk** — inability to demonstrate that a process ran exactly as described

DEL treats determinism as a first-class architectural property, not an afterthought.

## The four pillars of determinism

### 1. Explicit inputs and outputs

Every Step in DEL has a declared input schema and output schema. Data flows between Steps exclusively through these typed contracts — there are no hidden global variables, no shared mutable state between Steps, and no undeclared dependencies.

This means:

- The complete input to a Step can be serialized and stored
- Any Step can be re-executed in isolation given its stored input
- The lineage of any output value can be traced back through the DAG to the original pipeline input

### 2. Controlled side effects

Side effects (writing to a database, sending an email, storing a file) are permitted in DEL but must go through the Service layer. This means:

- Every side effect is mediated by an auditable adapter
- Side effects are recorded in the audit log alongside the Step that produced them
- Adapters can be swapped for mock implementations in tests without modifying Step code

Steps that require external I/O declare it explicitly in their dependency injection signature. Steps that are pure transformations have no service dependencies and are trivially reproducible.

### 3. Stable serialization

DEL avoids sources of non-deterministic serialization:

- **JSON key ordering** — object keys are always serialized in a consistent order (sorted alphabetically or in declaration order, depending on the schema)
- **Timestamps** — Steps receive timestamps as explicit inputs; they do not call `Date.now()` or `new Date()` internally
- **Floating-point arithmetic** — numeric operations that could produce platform-dependent results are avoided or explicitly constrained
- **Set/Map iteration** — converted to arrays with a defined sort order before serialization

### 4. Auditable execution records

Every pipeline run produces an immutable execution record stored in the database. The record includes:

- Pipeline name and version
- Run ID (UUID v4, generated deterministically from run parameters when seeded)
- Timestamp of run initiation
- For each Step: input snapshot, output snapshot, status, duration, attempt count
- Any errors, including stack traces and retry history

These records enable full replay: a past run can be re-executed by feeding its stored inputs back through the same pipeline version.

## Idempotency

Idempotency is the property that running a Step multiple times with the same inputs has the same effect as running it once. DEL enforces idempotency through:

- **Run-ID-keyed deduplication** in the task queue — if a task with the same run ID and step name is already in the queue or has already completed, it will not be enqueued again
- **Upsert semantics** in database writes — Steps use `INSERT ... ON CONFLICT DO UPDATE` rather than `INSERT` followed by `UPDATE`
- **Content-addressed storage keys** — files stored in S3/GCS use a hash of their content as part of the key, so re-uploading the same file is a no-op

## Seed-based randomness

Some pipelines require random values (e.g., generating unique identifiers or shuffling data for testing). DEL recommends using seeded pseudo-random number generators (PRNGs) rather than `Math.random()`:

- The seed is declared as an explicit pipeline input
- The PRNG state is deterministic given the seed
- The same seed always produces the same sequence of random values

This means pipelines that require randomness are still reproducible as long as the seed is preserved in the audit log.

## What DEL does not guarantee

DEL does not guarantee determinism in the presence of:

- **External API calls** that return different data at different times (e.g., live market prices, current weather). These should be treated as non-deterministic inputs and their responses should be cached/stored in the audit log if replay is required.
- **Wall-clock time used for business logic** — if a Step branches based on `new Date()`, it is not deterministic. Use explicit timestamp inputs instead.
- **Non-deterministic upstream tools** — some compilers or minifiers may produce different output across versions. Pin dependency versions in `package.json` and lock them with `pnpm-lock.yaml`.

## Verifying determinism

To verify that a pipeline is deterministic:

1. Run the pipeline with a fixed input and record the run ID.
2. Re-run the pipeline with the same input.
3. Compare the audit logs for both runs — inputs, outputs, and all intermediate Step results should be byte-for-byte identical.

The DEL test suite includes determinism regression tests for core pipelines. Run them with:

```bash
pnpm run test
```

## Reproducibility in CI/CD

The `.github/workflows/` CI pipeline pins Node.js to version 20, pins the pnpm version, and uses `pnpm-lock.yaml` to ensure all dependency versions are fixed. This means every CI run is executed in an identical environment, making CI failures reproducible locally.

To reproduce a CI environment locally:

```bash
pnpm install --frozen-lockfile
pnpm run build
pnpm run test
```
