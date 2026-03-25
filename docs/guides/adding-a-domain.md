# Adding a Domain

This guide walks you through creating a new business domain in the Deterministic Execution Layer (DEL). A Domain is a logical grouping of related Pipelines. Adding a domain means creating the directory structure, defining any domain-specific types, and creating your first pipeline within the domain.

## When to create a new domain

Create a new domain when:

- You are adding pipelines for a new business area that has no overlap with existing domains (coding, billing, CRM, media, documents).
- The new area has its own distinct input/output types, vocabulary, and service dependencies.
- The new area is likely to grow to multiple related pipelines over time.

If you are adding a single pipeline that is clearly an extension of an existing domain, add it to that domain instead. See [Adding a Pipeline](adding-a-pipeline.md).

## Step 1: Create the domain directory

```bash
mkdir -p src/pipelines/<domain-name>
```

Use a short, lowercase, singular noun for the domain name. Examples: `analytics`, `inventory`, `logistics`, `notifications`.

```bash
mkdir -p src/pipelines/analytics
```

## Step 2: Create an index file

Create an `index.ts` barrel file in the domain directory. This will export all pipelines in the domain and serve as the public interface.

```typescript
// src/pipelines/analytics/index.ts

// Pipelines will be exported here as they are added
// export { generateReport } from './generateReport';
// export { computeMetrics } from './computeMetrics';
```

## Step 3: Define domain-specific types (optional)

If your domain has types that are shared across multiple of its pipelines, create a `types.ts` file:

```typescript
// src/pipelines/analytics/types.ts
import { z } from 'zod';

export const TimeRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export type TimeRange = z.infer<typeof TimeRangeSchema>;

export const MetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  timestamp: z.coerce.date(),
});

export type Metric = z.infer<typeof MetricSchema>;
```

## Step 4: Create the first pipeline

Every domain needs at least one pipeline to be useful. Create your first pipeline file:

```bash
touch src/pipelines/analytics/generateReport.ts
```

Follow the full process in [Adding a Pipeline](adding-a-pipeline.md) to implement the pipeline.

Example skeleton:

```typescript
// src/pipelines/analytics/generateReport.ts
import { z } from 'zod';
import { TimeRangeSchema } from './types';

export const GenerateReportInputSchema = z.object({
  reportType: z.enum(['daily', 'weekly', 'monthly']),
  range: TimeRangeSchema,
  format: z.enum(['json', 'csv', 'pdf']).default('json'),
});

export const GenerateReportOutputSchema = z.object({
  reportKey: z.string(),  // Storage key where the report was saved
  rowCount: z.number(),
  generatedAt: z.coerce.date(),
});

export type GenerateReportInput = z.infer<typeof GenerateReportInputSchema>;
export type GenerateReportOutput = z.infer<typeof GenerateReportOutputSchema>;

export async function generateReport(
  input: GenerateReportInput
): Promise<GenerateReportOutput> {
  const validated = GenerateReportInputSchema.parse(input);
  
  // Implementation here
  
  return GenerateReportOutputSchema.parse({
    reportKey: `reports/${validated.reportType}/${Date.now()}.${validated.format}`,
    rowCount: 0,
    generatedAt: new Date(),
  });
}
```

## Step 5: Create test files

Create a test directory and file:

```bash
touch src/tests/pipelines/analytics.test.ts
```

```typescript
// src/tests/pipelines/analytics.test.ts
import { describe, it, expect } from 'vitest';
import { generateReport } from '../../pipelines/analytics/generateReport';

describe('analytics domain', () => {
  describe('generateReport', () => {
    it('generates a daily JSON report', async () => {
      const result = await generateReport({
        reportType: 'daily',
        range: { from: new Date('2024-01-01'), to: new Date('2024-01-02') },
        format: 'json',
      });

      expect(result.reportKey).toMatch(/^reports\/daily\//);
      expect(result.generatedAt).toBeInstanceOf(Date);
    });
  });
});
```

Run the tests:

```bash
pnpm run test
```

## Step 6: Document the domain

Add an entry for the new domain in [Domains](../architecture/domains.md) with:
- A description of what the domain handles
- A table of pipeline files and their purpose
- The key services and tools used

## Step 7: Enforce domain boundaries

Follow these rules to keep domains cleanly separated:

1. **No cross-domain imports from pipeline files.** Domain `analytics` must not import from `src/pipelines/billing/`.
2. **Shared code goes in `src/helpers/`.** If `analytics` and `billing` both need the same helper function, put it in `src/helpers/`, not in either domain.
3. **Cross-domain communication uses the queue.** If `billing` needs to trigger an `analytics` report after a payment, it enqueues an event — it does not call the analytics pipeline directly.

## Checklist

- [ ] Domain directory created: `src/pipelines/<domain-name>/`
- [ ] `index.ts` barrel file created
- [ ] Domain-specific `types.ts` created (if applicable)
- [ ] At least one pipeline implemented
- [ ] Test file created in `src/tests/pipelines/`
- [ ] Tests pass (`pnpm run test`)
- [ ] Domain documented in `docs/architecture/domains.md`
- [ ] Domain boundaries respected (no cross-domain pipeline imports)
