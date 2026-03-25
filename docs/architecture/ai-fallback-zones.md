# AI Fallback Zones

The Deterministic Execution Layer (DEL) is built on the principle of deterministic, reproducible execution. However, there are real-world use cases where strict determinism is insufficient — where the problem space is too large, too ambiguous, or too dynamic for purely rule-based execution. This document describes where and how AI/LLM assistance can be integrated into DEL without undermining the platform's core guarantees.

## The tension between AI and determinism

Large Language Models (LLMs) are inherently non-deterministic: given the same prompt, they may return different outputs on different calls (even at `temperature=0`, minor differences can appear across model versions). This creates a conflict with DEL's reproducibility guarantee.

DEL resolves this tension by treating AI as a **fallback** — a last resort invoked only when deterministic rules fail — and by treating AI outputs as **external inputs** that are captured, stored, and audited, just like any other non-deterministic external data source.

## Where AI is appropriate

### 1. Code generation assistance

In the `coding` pipeline, deterministic tools (linters, compilers, type checkers) can identify that code has a problem but cannot always fix it automatically. When autofix rules are exhausted and the error is a known class of LLM-solvable problem (e.g., type annotation, import resolution, refactoring), an AI fallback Step can suggest a fix.

**Pattern:**
```
[lintCode] → [autofixLint] → (if still failing) → [llmCodeFix] → [lintCode again]
```

### 2. Document parsing and extraction

In the `media` and `documents` pipelines, some documents (scanned PDFs, hand-written forms, poorly formatted HTML) cannot be reliably parsed by deterministic tools. An AI fallback Step can extract structured data from unstructured content when rule-based extraction fails.

**Pattern:**
```
[pdfToText] → [extractStructuredData] → (if confidence < threshold) → [llmExtract]
```

### 3. Schema inference

When data arrives without an explicit schema (e.g., a new third-party API response format), an AI step can infer a Zod schema from example data. This generated schema is then reviewed, stored, and used deterministically on subsequent runs.

**Pattern:**
```
[receiveUnknownData] → [inferSchema via LLM] → [human review / store schema] → [validateWithStoredSchema]
```

### 4. Error classification and triage

When a pipeline fails with an error message that doesn't match any known error pattern, an AI step can classify the error (infrastructure failure, data error, code bug) and suggest a remediation action. This assists operators without replacing the deterministic retry logic.

### 5. Natural language configuration

Some domain configurations (billing rules, CRM workflows, document templates) are authored in natural language by non-technical users. An AI step can translate natural language rules into structured DEL pipeline configurations.

## Principles for safe AI integration

### Principle 1: AI is a Step, not a service

AI calls are always wrapped in a DEL Step with explicit input and output schemas. This ensures:
- The AI prompt is captured in the audit log (as Step input)
- The AI response is validated against an output schema before use
- The AI call participates in the retry and DLQ mechanism

### Principle 2: AI outputs are treated as external data

Like an external API call, an LLM response is non-deterministic. DEL handles this the same way it handles any non-deterministic external input: the response is stored in the audit log at the time of the call, and any replay of the run uses the stored response rather than calling the LLM again.

### Principle 3: AI fallback is gated by confidence thresholds

AI steps should return a confidence score alongside their output. Downstream Steps can check this score and reject low-confidence outputs, falling through to human review or pipeline failure rather than proceeding with uncertain data.

### Principle 4: AI does not modify pipeline logic

AI may produce data that flows through a pipeline, but it must not dynamically modify the pipeline's DAG, Step implementations, or schemas at runtime. The pipeline structure is always deterministic and statically defined.

### Principle 5: Temperature = 0 where possible

When using LLMs in DEL, set `temperature=0` (or the minimum available value) to minimize but not eliminate output variance. Combined with response storage, this provides the most reproducible AI behavior achievable.

## Implementation pattern

A canonical AI fallback Step looks like this:

```typescript
import { z } from 'zod';

const AIFallbackInputSchema = z.object({
  prompt: z.string(),
  context: z.record(z.unknown()),
  maxTokens: z.number().default(1000),
});

const AIFallbackOutputSchema = z.object({
  result: z.string(),
  confidence: z.number().min(0).max(1),
  model: z.string(),
  promptTokens: z.number(),
  completionTokens: z.number(),
});

export async function llmFallbackStep(input: z.infer<typeof AIFallbackInputSchema>) {
  const validated = AIFallbackInputSchema.parse(input);
  
  // Call LLM (e.g., OpenAI, Anthropic, local model)
  const response = await callLLM({
    prompt: validated.prompt,
    temperature: 0,
    maxTokens: validated.maxTokens,
  });

  return AIFallbackOutputSchema.parse({
    result: response.text,
    confidence: response.confidence ?? 0.8,
    model: response.model,
    promptTokens: response.usage.promptTokens,
    completionTokens: response.usage.completionTokens,
  });
}
```

## Governance

AI fallback zones should be:
- Explicitly documented in the pipeline's design documentation
- Subject to regular review to determine whether a deterministic solution has become available
- Logged at a distinct log level (`info` with `ai_fallback: true` metadata) so they can be monitored and audited separately

The goal is to reduce AI fallback usage over time as deterministic rules improve, not to expand it.
