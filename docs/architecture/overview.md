# Deterministic Execution Layer (DEL) — Architecture Overview

> Status: Draft (v1)

This document describes the high-level architecture of the Deterministic Execution Layer (DEL): what it is, how it is structured, and the design principles that guide it.

## What DEL is

DEL is a deterministic workflow and pipeline execution platform designed to run multi-step jobs with full reproducibility, auditability, and strong operational tooling. It is built with TypeScript and targets Node.js 20+.

At a high level, DEL provides:

- **Deterministic pipeline orchestration** — given the same inputs, code version, and configuration, a run will always produce the same outputs.
- **Scheduling and queueing primitives** — cron-based scheduling, event queues, task queues, retry queues, and dead-letter queues.
- **Pluggable adapters** for storage (AWS S3, Google Cloud Storage, local filesystem), database (PostgreSQL with pgvector), and email (SMTP).
- **Strong validation and tooling** — Zod schemas, JSON Schema, XML/CSV/YAML validators, linters, formatters, minifiers, compilers, converters, and bundlers for 10+ languages.

## Core concepts

### Determinism

A pipeline run is reproducible given the same:

- Input payloads
- Configuration
- Code version
- Dependency versions

This is achieved through:

- Explicit inputs and outputs for every step
- Controlled side effects (all I/O goes through auditable adapters)
- Stable serialization (no non-deterministic JSON key ordering or floating-point ambiguity)
- Auditable execution records stored for replay and diagnosis

### Pipeline orchestration

Pipelines are modeled as task graphs (DAGs) with:

- Dependency scheduling via topological ordering
- Cycle detection at pipeline registration time
- Configurable retries with exponential backoff
- Dead-letter handling for permanently failed tasks

### Execution and observability

Every pipeline execution emits structured logs and audit trails (Winston-based) so that runs can be inspected, replayed, and diagnosed. Audit logs capture step inputs, outputs, status, timestamps, and error details.

## Repository structure

| Path | Purpose |
|------|---------|
| `src/configs/` | Configuration files and environment variable definitions |
| `src/services/` | Core services: logger, database, queue, storage, email, scheduler, crypto |
| `src/tools/` | Validators, linters, formatters, minifiers, converters, compilers, bundlers |
| `src/pipelines/` | Business pipelines: coding, billing, CRM, media, documents |
| `src/helpers/` | Shared helper functions used across pipelines and services |
| `src/templates/` | Email and document templates |
| `src/tests/` | Unit and integration tests (Vitest) |
| `docker/` | Dockerfile and docker-compose for local development |
| `.github/workflows/` | CI/CD workflow definitions |

## Architectural boundaries

Key principles:

- **Keep upstream engines as external dependencies** (Docker images, third-party releases). Do not vendor large upstream repositories.
- **Keep orchestration platform code isolated and cohesive.** The DEL runtime should not grow into the tools it orchestrates.
- **Keep proprietary modules separated by responsibility** — connectors, SDKs, workflows, and agents should each have a clear boundary.
- **Prefer stable integration via APIs.** Differentiation belongs in adapters, orchestration logic, and workflows — not in forked dependencies.

## Further reading

- [Core Concepts](core-concepts.md)
- [Determinism and Reproducibility](determinism-and-reproducibility.md)
- [Domains](domains.md)
- [Pipelines](pipelines.md)
- [Services](services.md)
- [Tooling and Macro Tools](tooling-and-macro-tools.md)
- [Validation and Autofix](validation-and-autofix.md)
- [AI Fallback Zones](ai-fallback-zones.md)