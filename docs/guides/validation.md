# Validation Guide

This guide explains how to use the Deterministic Execution Layer (DEL) validation system: validating pipeline inputs, configuration files, and data files using the built-in validators.

## Overview

DEL has two levels of validation:

1. **Automatic pipeline validation** — schemas are validated automatically at runtime as data flows through pipelines. You do not need to call validators manually for in-pipeline data.
2. **Manual validation** — you can call validators directly to validate configuration files, data files, or external inputs before feeding them into a pipeline.

For the architecture of the validation system, see [Validation and Autofix](../architecture/validation-and-autofix.md).

## Validating pipeline inputs

Every pipeline has a declared input schema (Zod). If you pass an invalid input, the pipeline will throw a `ZodError` with a detailed description of every field that failed validation.

```typescript
import { lintCode } from './dist/pipelines/coding/lintCode.js';

try {
  const result = await lintCode({
    sourceCode: '',           // invalid: empty string
    language: 'cobol',        // invalid: not a supported language
  });
} catch (err) {
  if (err instanceof ZodError) {
    console.error(err.errors);
    // [
    //   { path: ['sourceCode'], message: 'String must contain at least 1 character(s)' },
    //   { path: ['language'], message: "Invalid enum value. Expected 'typescript' | 'javascript' | 'python' | 'go'" }
    // ]
  }
}
```

## Using the schema validator (Zod)

The `schemaValidator` tool wraps Zod validation with DEL's standardized `ValidationResult` format:

```typescript
import { schemaValidator } from './src/tools/validators/schemaValidator';
import { z } from 'zod';

const MySchema = z.object({
  name: z.string().min(1),
  count: z.number().int().positive(),
});

const result = schemaValidator(MySchema, { name: 'test', count: 42 });

if (result.valid) {
  console.log(result.data);   // { name: 'test', count: 42 } (typed)
} else {
  console.error(result.errors);
  // [{ path: '/name', message: '...' }, ...]
}
```

## Validating JSON data against a JSON Schema

Use the `jsonSchemaValidator` when working with JSON Schema (draft-07) definitions:

```typescript
import { jsonSchemaValidator } from './src/tools/validators/jsonSchemaValidator';

const schema = {
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
    amount: { type: 'number', minimum: 0 },
  },
  required: ['userId', 'amount'],
};

const result = jsonSchemaValidator(schema, { userId: 'abc-123', amount: -5 });
// result.valid === false
// result.errors: [{ path: '/amount', message: 'must be >= 0' }]
```

## Validating XML files

```typescript
import { xmlSchemaValidator } from './src/tools/validators/xmlSchemaValidator';
import { readFileSync } from 'fs';

const xsd = readFileSync('schema/invoice.xsd', 'utf-8');
const xml = readFileSync('data/invoice.xml', 'utf-8');

const result = xmlSchemaValidator(xsd, xml);
if (!result.valid) {
  result.errors.forEach(e => console.error(`${e.path}: ${e.message}`));
}
```

## Validating CSV files

```typescript
import { csvValidator } from './src/tools/validators/csvValidator';

const columnDefinitions = [
  { name: 'id', type: 'number', required: true },
  { name: 'email', type: 'string', required: true },
  { name: 'createdAt', type: 'date', required: false },
];

const result = csvValidator(csvContent, { columns: columnDefinitions });
```

## Validating YAML files

```typescript
import { yamlValidator } from './src/tools/validators/yamlValidator';

const result = yamlValidator(yamlContent, optionalJsonSchema);
// Checks YAML syntax first, then optionally validates structure against a JSON Schema
```

## Validating configuration files

DEL configuration files (`defaultConfig.json`, `loggingConfig.json`) are validated at startup. To manually validate a configuration file against the expected schema:

```bash
pnpm run build

# Validate a data file
node -e "
const { jsonSchemaValidator } = require('./dist/tools/validators/jsonSchemaValidator');
const data = require('./src/configs/defaultConfig.json');
// ... apply schema
"
```

## Validating file uploads

Use the `fileValidator` before processing any user-uploaded file in the `media` or `documents` pipelines:

```typescript
import { fileValidator } from './src/tools/validators/fileValidator';

const result = fileValidator(fileBuffer, {
  allowedMimeTypes: ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSizeBytes: 104_857_600,  // 100 MB
  allowedExtensions: ['.pdf', '.docx'],
});

if (!result.valid) {
  throw new Error(`File validation failed: ${result.errors.map(e => e.message).join(', ')}`);
}
```

## Running validation tests

The test suite in `src/tests/tools/validators.test.ts` covers all validators:

```bash
pnpm run test -- --reporter=verbose src/tests/tools/validators.test.ts
```

## Autofix patterns

If a validation fails due to a fixable issue (formatting, missing defaults), consider using autofix before failing hard. See the [Validation and Autofix architecture doc](../architecture/validation-and-autofix.md) for details.
