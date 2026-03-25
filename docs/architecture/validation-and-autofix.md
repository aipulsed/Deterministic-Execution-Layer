# Validation and Autofix

The Deterministic Execution Layer (DEL) provides a comprehensive validation system that operates at multiple levels: schema validation for data payloads, file-format validation for documents and data files, and autofix patterns that can automatically correct common validation failures.

## Validation layers

### 1. Step input/output validation (Zod)

Every Step in DEL declares its input and output schemas using [Zod](https://zod.dev). Schema validation is the primary validation mechanism and runs automatically at runtime before a Step executes and after it completes.

Zod is used because:
- Schemas are TypeScript-native (schemas produce TypeScript types automatically)
- Error messages are precise and structured
- Schemas support transformation and coercion, not just validation

Example:

```typescript
import { z } from 'zod';

const InputSchema = z.object({
  sourceCode: z.string().min(1),
  language: z.enum(['typescript', 'javascript', 'python', 'go']),
  options: z.object({
    strict: z.boolean().default(false),
  }).optional(),
});

const OutputSchema = z.object({
  compiled: z.string(),
  warnings: z.array(z.string()),
  duration: z.number().positive(),
});

type Input = z.infer<typeof InputSchema>;
type Output = z.infer<typeof OutputSchema>;
```

The `schemaValidator.ts` tool in `src/tools/validators/` wraps Zod validation with structured error reporting compatible with the DEL validation result format.

### 2. JSON Schema validation (`jsonSchemaValidator.ts`)

For cases where schemas are defined externally (e.g., third-party API contracts, OpenAPI schemas), DEL supports [JSON Schema](https://json-schema.org/) (draft-07) validation via [Ajv](https://ajv.js.org/).

```typescript
import { jsonSchemaValidator } from '../../tools/validators/jsonSchemaValidator';

const result = jsonSchemaValidator(schema, data);
// result.valid: boolean
// result.errors: AjvError[] | null
```

JSON Schema validation is used in the `documents` pipeline for validating document structure.

### 3. XML Schema validation (`xmlSchemaValidator.ts`)

For XML documents, DEL validates against XSD schemas:

```typescript
import { xmlSchemaValidator } from '../../tools/validators/xmlSchemaValidator';

const result = xmlSchemaValidator(xsdSchema, xmlContent);
```

### 4. CSV validation (`csvValidator.ts`)

CSV validation checks:
- Header presence and naming
- Row count and column count consistency
- Per-column type validation (string, number, date, enum)
- Required field presence

### 5. YAML validation (`yamlValidator.ts`)

YAML validation covers:
- Syntactic validity (valid YAML)
- Structural conformance against a JSON Schema applied after YAML→JSON conversion

### 6. File validation (`fileValidator.ts`)

File validation checks:
- MIME type against an allowed list
- File size against a maximum
- File extension consistency with MIME type

This is used in the `media` and `documents` pipelines to gate processing of uploaded files.

## Validation result format

All validators return a consistent result structure:

```typescript
interface ValidationResult<T = unknown> {
  valid: boolean;
  data?: T;              // parsed and validated data (if valid)
  errors: ValidationError[];
}

interface ValidationError {
  path: string;          // JSON Pointer to the failing field (e.g., "/options/strict")
  message: string;       // Human-readable error message
  code?: string;         // Machine-readable error code
}
```

## Autofix patterns

Autofix is the practice of automatically correcting certain classes of validation failure before returning an error to the caller. DEL implements autofix at the tool level — individual validators and formatters can be composed to validate-then-fix.

### Format autofix

Formatting violations (wrong indentation, trailing whitespace, missing newline at end of file) are automatically corrected by running the appropriate formatter:

```typescript
import { jsonFormatter } from '../../tools/formatters/jsonFormatter';
import { jsonSchemaValidator } from '../../tools/validators/jsonSchemaValidator';

// Validate first
let result = jsonSchemaValidator(schema, rawJson);

if (!result.valid && isFormatOnlyError(result.errors)) {
  // Autofix: reformat and re-validate
  const reformatted = jsonFormatter(rawJson);
  result = jsonSchemaValidator(schema, reformatted);
}
```

### Type coercion autofix

Zod schemas support `.coerce` which automatically converts string representations of numbers, booleans, and dates:

```typescript
const schema = z.object({
  count: z.coerce.number(),    // "42" → 42
  active: z.coerce.boolean(),  // "true" → true
  createdAt: z.coerce.date(),  // "2024-01-01" → Date object
});
```

### Default value injection

Zod `.default()` automatically populates missing optional fields with their default values, which can be thought of as a structural autofix:

```typescript
const schema = z.object({
  maxRetries: z.number().default(3),
  timeout: z.number().default(30000),
});
```

## Integration with the pipeline

Validation is integrated into the pipeline at three points:

1. **Pipeline input validation** — the pipeline's top-level input schema is validated before any Step runs. If the input is invalid, the pipeline fails immediately without creating any audit records.

2. **Step input validation** — before each Step executes, its input schema is validated against the data resolved from upstream Steps. This catches schema drift between Steps early.

3. **Step output validation** — after each Step returns, its output schema is validated. An output that fails validation is treated as a Step error and triggers the retry mechanism.

## Running validation checks manually

To validate a configuration file or data file against a known schema:

```bash
pnpm run build
node dist/tools/validators/schemaValidator.js --schema path/to/schema.json --data path/to/data.json
```

To validate all pipeline inputs in the test suite:

```bash
pnpm run test
```

See the [Validation guide](../guides/validation.md) for usage examples.
