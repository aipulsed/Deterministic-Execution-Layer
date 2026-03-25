# Adding a Pipeline

This guide walks you through creating a new Pipeline in the Deterministic Execution Layer (DEL). Pipelines are the top-level units of work: typed, DAG-structured workflows that orchestrate Steps toward a business goal.

## Before you start

- Decide which Domain your pipeline belongs to (coding, billing, CRM, media, documents) or whether you need a [new domain](adding-a-domain.md).
- Identify the Steps your pipeline needs and their data dependencies.
- Define the input and output types.

## Step 1: Create the pipeline file

Pipeline files live in `src/pipelines/<domain>/`. Use camelCase for the filename.

```bash
touch src/pipelines/documents/summarizeDocument.ts
```

## Step 2: Define input and output schemas

Use Zod for all schema definitions. The schema serves as the contract, the validation layer, and the TypeScript type source simultaneously.

```typescript
// src/pipelines/documents/summarizeDocument.ts
import { z } from 'zod';

export const SummarizeDocumentInputSchema = z.object({
  documentKey: z.string().min(1),      // Storage key of the source document
  language: z.string().default('en'),  // Language of the document
  maxWords: z.number().int().positive().default(200),
});

export const SummarizeDocumentOutputSchema = z.object({
  summary: z.string(),
  wordCount: z.number(),
  processingDuration: z.number(),
});

export type SummarizeDocumentInput = z.infer<typeof SummarizeDocumentInputSchema>;
export type SummarizeDocumentOutput = z.infer<typeof SummarizeDocumentOutputSchema>;
```

## Step 3: Implement the Steps

For a simple pipeline (one logical action, no branching), you can implement it as a single exported async function:

```typescript
import { storage } from '../../services/storage';
import { pdfToText } from '../../tools/converters/pdfToText';
import { logger } from '../../services/logger';

export async function summarizeDocument(
  input: SummarizeDocumentInput
): Promise<SummarizeDocumentOutput> {
  const validated = SummarizeDocumentInputSchema.parse(input);
  const start = Date.now();

  logger.info('summarizeDocument: starting', { documentKey: validated.documentKey });

  // Step 1: Download the document
  const fileBuffer = await storage.download(validated.documentKey);

  // Step 2: Extract text
  const text = await pdfToText(fileBuffer);

  // Step 3: Summarize (simple truncation; replace with real summarizer)
  const words = text.split(/\s+/);
  const summary = words.slice(0, validated.maxWords).join(' ');

  const result = SummarizeDocumentOutputSchema.parse({
    summary,
    wordCount: words.length,
    processingDuration: Date.now() - start,
  });

  logger.info('summarizeDocument: complete', { documentKey: validated.documentKey });
  return result;
}
```

## Step 4: Define a multi-Step DAG (for complex pipelines)

For pipelines with multiple Steps and dependencies, define the DAG explicitly:

```typescript
export const SummarizeDocumentDAG = {
  steps: {
    downloadDocument: {
      fn: downloadDocumentStep,
      inputs: (pipelineInput: SummarizeDocumentInput) => ({
        key: pipelineInput.documentKey,
      }),
      dependencies: [],
    },
    extractText: {
      fn: extractTextStep,
      inputs: (_, stepOutputs) => ({
        fileBuffer: stepOutputs.downloadDocument.buffer,
        mimeType: stepOutputs.downloadDocument.mimeType,
      }),
      dependencies: ['downloadDocument'],
    },
    generateSummary: {
      fn: generateSummaryStep,
      inputs: (pipelineInput, stepOutputs) => ({
        text: stepOutputs.extractText.text,
        maxWords: pipelineInput.maxWords,
      }),
      dependencies: ['extractText'],
    },
  },
  output: (stepOutputs) => ({
    summary: stepOutputs.generateSummary.summary,
    wordCount: stepOutputs.extractText.wordCount,
    processingDuration: stepOutputs.generateSummary.duration,
  }),
};
```

The DEL pipeline runner validates this DAG for cycles at registration time and computes the topological execution order.

## Step 5: Write tests

Create a test file in `src/tests/pipelines/` (or add to an existing domain test file):

```typescript
// src/tests/pipelines/documents.test.ts
import { describe, it, expect, vi } from 'vitest';
import { summarizeDocument } from '../../pipelines/documents/summarizeDocument';

// Mock services for unit testing
vi.mock('../../services/storage', () => ({
  storage: {
    download: vi.fn().mockResolvedValue(Buffer.from('Hello world test document content')),
  },
}));

describe('summarizeDocument', () => {
  it('returns a summary for a valid document', async () => {
    const result = await summarizeDocument({
      documentKey: 'test/doc.pdf',
      maxWords: 5,
    });

    expect(result.summary).toBeTruthy();
    expect(result.wordCount).toBeGreaterThan(0);
    expect(result.processingDuration).toBeGreaterThan(0);
  });

  it('rejects invalid input', async () => {
    await expect(
      summarizeDocument({ documentKey: '', maxWords: -1 })
    ).rejects.toThrow();
  });
});
```

Run the tests:

```bash
pnpm run test
```

## Step 6: Register the pipeline (if using the scheduler or API)

If the pipeline should be triggerable via the scheduler or the DEL API, register it at startup in `src/index.ts`:

```typescript
import { summarizeDocument } from './pipelines/documents/summarizeDocument';
import { pipelineRegistry } from './services/scheduler';

pipelineRegistry.register('summarizeDocument', summarizeDocument);
```

## Step 7: Update documentation

If this is a significant new pipeline, add it to the domain documentation in [Domains](../architecture/domains.md).

## Checklist

- [ ] Pipeline file created in `src/pipelines/<domain>/`
- [ ] Input and output schemas defined with Zod
- [ ] Step implementations written
- [ ] DAG defined (for multi-step pipelines)
- [ ] Unit tests written and passing (`pnpm run test`)
- [ ] Pipeline registered at startup (if needed)
- [ ] Documentation updated
