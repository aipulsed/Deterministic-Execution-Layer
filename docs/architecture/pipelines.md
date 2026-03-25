# Pipelines

This document describes how Pipelines are structured and executed in the Deterministic Execution Layer (DEL), including DAG modeling, topological ordering, cycle detection, retry handling, dead-letter processing, and the step lifecycle.

## What is a Pipeline?

A **Pipeline** is the top-level unit of work in DEL. It is a named, typed workflow composed of one or more Steps organized as a Directed Acyclic Graph (DAG). Each Pipeline:

- Accepts a strongly-typed input payload (validated by a Zod schema)
- Produces a strongly-typed output payload
- Declares its Steps and the data dependencies between them
- Is registered with the scheduler or invoked programmatically

Pipelines are organized into Domains under `src/pipelines/`. See [Domains](domains.md) for the list of built-in domains and their pipelines.

## DAG modeling

In DEL, pipeline Steps are the **nodes** of a DAG, and directed edges represent **data dependencies** — "Step A must complete and provide its output before Step B can begin."

A simple pipeline might look like:

```
Input
  │
  ▼
[validateInput] ──► [compileCode] ──► [runTests] ──► [bundleOutput]
                                           │
                                           ▼
                                      [generateReport]
```

In this example, `runTests` and `compileCode` must complete before `generateReport` and `bundleOutput` can start. `generateReport` and `bundleOutput` have no dependency on each other and can run in parallel.

## Topological ordering

Before a Pipeline executes, DEL computes a **topological sort** of its DAG. This determines the order in which Steps are scheduled as Tasks into the queue.

The topological sort algorithm (Kahn's algorithm) works as follows:

1. Compute the in-degree (number of incoming edges) for each Step.
2. Add all Steps with in-degree zero to the ready queue.
3. Dequeue a Step, emit it as next in the order, and decrement the in-degree of all its successors.
4. Add any successors whose in-degree reaches zero to the ready queue.
5. Repeat until the queue is empty.

The result is a linear ordering that respects all dependency constraints. Steps at the same "level" of the ordering (no dependency between them) can be executed in parallel.

## Cycle detection

DEL detects cycles at **pipeline registration time** — before any execution begins. If a cycle is detected, pipeline registration throws an error and the pipeline is not available for execution.

Cycle detection uses depth-first search (DFS) with a coloring scheme:

- **White** — not yet visited
- **Gray** — currently on the DFS stack (visiting)
- **Black** — fully visited

If DFS encounters a gray node (a back-edge), a cycle is reported. The error message identifies the Steps involved in the cycle.

```
Error: Cycle detected in pipeline "compileCodingPipeline": 
  compileCode → runTests → compileCode
```

## Step lifecycle

Each Step goes through the following lifecycle states during a pipeline run:

| State | Description |
|-------|-------------|
| `pending` | Step has been registered in the pipeline but not yet enqueued |
| `queued` | Step's dependencies have completed; Task has been added to the task queue |
| `running` | A worker has dequeued the Task and is executing it |
| `succeeded` | Step completed successfully; output is available for downstream Steps |
| `failed` | Step threw an error; will be retried if retry budget remains |
| `retrying` | Step failed and is waiting for the retry delay before re-queuing |
| `dead` | Step exceeded the maximum retry count; Task moved to the DLQ |
| `skipped` | Step was skipped because an upstream dependency entered the `dead` state |

## Retries with exponential backoff

When a Step fails with a transient error, DEL re-queues the Task with an exponential backoff delay:

```
delay = retryDelay × 2^(attemptNumber - 1) + jitter
```

Default retry configuration (from `defaultConfig.json`):

| Parameter | Default |
|-----------|---------|
| `maxRetries` | 3 |
| `retryDelay` | 5000 ms (5 seconds) |

So for a step with the default config:
- Attempt 1 fails → retry after ~5s
- Attempt 2 fails → retry after ~10s
- Attempt 3 fails → retry after ~20s
- Attempt 4 fails → Task sent to Dead Letter Queue

Jitter (a small random offset added to the delay) prevents thundering herd problems when many tasks fail simultaneously. This is the only source of non-determinism in the retry mechanism and does not affect pipeline output.

Steps can opt out of retries by setting `maxRetries: 0`, or declare custom retry counts per Step.

## Dead Letter Queue (DLQ)

Tasks that exhaust all retry attempts are moved to the **Dead Letter Queue (DLQ)**. The DLQ:

- Stores the full Task payload, including all input data and error history
- Retains entries for a configurable TTL (default: 86400 seconds / 24 hours)
- Is inspectable via the service layer — operators can view, reprocess, or discard DLQ entries
- Emits a structured log event at `error` level when a Task is DLQ'd

Reprocessing a DLQ entry re-enqueues the Task with a reset retry counter. This allows operators to manually recover from infrastructure failures once the underlying cause is resolved.

## Queue architecture

DEL uses a multi-queue architecture:

| Queue | Purpose |
|-------|---------|
| **Event Queue** | External events that trigger pipeline runs (webhooks, schedule ticks) |
| **Task Queue** | Individual Step executions within a running pipeline |
| **Retry Queue** | Failed Tasks awaiting their next retry attempt (delay is enforced here) |
| **Dead Letter Queue** | Permanently failed Tasks awaiting manual review |

All queues are backed by Redis (configured via `REDIS_URL`).

## Parallel execution

Steps with no inter-dependency are eligible for parallel execution. DEL's task queue dispatcher pulls all currently-ready Tasks and dispatches them concurrently. The degree of parallelism is limited by the configured worker pool size (derived from `DATABASE_POOL_SIZE` by default but configurable separately).

## Pipeline registration

To register a pipeline with the DEL runtime:

1. Define the pipeline's Steps and their dependency edges in a DAG structure.
2. Export the pipeline definition from your domain file.
3. Import and register the pipeline at application startup (typically in `src/index.ts`).

At registration, DEL:
1. Validates the input and output schemas.
2. Runs cycle detection on the DAG.
3. Computes and caches the topological order.
4. Makes the pipeline available for scheduling and direct invocation.

## Observability

Every pipeline run emits structured log events at each lifecycle transition. The logger service (Winston) writes to `logs/app.log` and `logs/error.log`. Audit entries for each Step (inputs, outputs, duration, status) are written to the database for long-term storage and replay.

See [Services](services.md) for details on the logger and database services.
