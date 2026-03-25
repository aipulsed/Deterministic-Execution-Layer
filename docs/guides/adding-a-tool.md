# Adding a Tool

This guide walks you through the process of adding a new tool to the Deterministic Execution Layer (DEL). Tools are stateless utilities that perform discrete transformations on data or code. They live under `src/tools/` and are organized by category.

## When to add a tool vs. a service

- **Add a tool** if the operation is stateless (no database, no queue, no external API calls) and produces output as a pure function of its input.
- **Add a service** if the operation requires state, connection pooling, lifecycle management, or external infrastructure.
- **Add a helper** if the code is shared logic used by multiple tools or pipelines but doesn't fit a tool category.

## Step 1: Choose the right category

Tools are organized into these categories under `src/tools/`:

| Category | When to use |
|----------|------------|
| `linters/` | Static analysis of source code or data formats |
| `formatters/` | Reformatting source code or structured data |
| `minifiers/` | Reducing file size by removing non-semantic content |
| `converters/` | Transforming data from one format to another |
| `compilers/` | Transforming source code into a compiled artifact |
| `bundlers/` | Combining multiple files into a single output |
| `validators/` | Checking that data conforms to a schema or format |
| `media-handlers/` | Processing binary media files (images, audio, video, PDF) |

If your tool doesn't fit any category, create a new directory with a descriptive name.

## Step 2: Create the tool file

Create a new file in the appropriate category directory. Use camelCase for the filename.

For example, to add a TOML validator:

```bash
touch src/tools/validators/tomlValidator.ts
```

## Step 3: Implement the tool

Every tool must follow these conventions:

1. **Export a named function** with a descriptive name matching the filename.
2. **Declare explicit typed inputs and outputs** — use TypeScript interfaces or Zod schemas.
3. **Return a structured result** — for validators, use the `ValidationResult` format; for transformers, return the transformed content.
4. **Be a pure function** — no side effects, no imports from `src/services/`.
5. **Be synchronous** if possible; async only if the underlying library requires it.

### Example: TOML validator

```typescript
// src/tools/validators/tomlValidator.ts
import * as TOML from '@iarna/toml';

export interface TomlValidationResult {
  valid: boolean;
  data?: unknown;
  errors: Array<{ path: string; message: string }>;
}

/**
 * Validates that the given string is valid TOML.
 * Optionally validates the parsed object against a provided predicate.
 */
export function tomlValidator(
  content: string,
  validate?: (parsed: unknown) => boolean
): TomlValidationResult {
  try {
    const parsed = TOML.parse(content);

    if (validate && !validate(parsed)) {
      return {
        valid: false,
        errors: [{ path: '/', message: 'Parsed TOML did not pass custom validation' }],
      };
    }

    return { valid: true, data: parsed, errors: [] };
  } catch (err) {
    return {
      valid: false,
      errors: [
        {
          path: '/',
          message: err instanceof Error ? err.message : 'Invalid TOML',
        },
      ],
    };
  }
}
```

## Step 4: Add a dependency (if needed)

If your tool requires a new npm package, add it:

```bash
pnpm add @iarna/toml
```

Before adding new dependencies, check for known vulnerabilities and prefer well-maintained packages with TypeScript support.

## Step 5: Write tests

Create a test file in `src/tests/tools/`:

```typescript
// src/tests/tools/validators.test.ts  (add to existing file, or create a new one)
import { describe, it, expect } from 'vitest';
import { tomlValidator } from '../../tools/validators/tomlValidator';

describe('tomlValidator', () => {
  it('accepts valid TOML', () => {
    const result = tomlValidator('[database]\nhost = "localhost"\nport = 5432\n');
    expect(result.valid).toBe(true);
    expect(result.data).toEqual({ database: { host: 'localhost', port: 5432 } });
  });

  it('rejects invalid TOML', () => {
    const result = tomlValidator('not valid = toml = syntax');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('applies custom validation', () => {
    const hasDatabase = (d: unknown) => typeof d === 'object' && d !== null && 'database' in d;
    const result = tomlValidator('[other]\nkey = "value"\n', hasDatabase);
    expect(result.valid).toBe(false);
  });
});
```

Run the tests:

```bash
pnpm run test
```

## Step 6: Export from the category index (if one exists)

If the category has an `index.ts` barrel file, add your tool to the exports:

```typescript
// src/tools/validators/index.ts
export { tomlValidator } from './tomlValidator';
```

## Step 7: Update documentation

Add an entry for your new tool in [Tooling and Macro Tools](../architecture/tooling-and-macro-tools.md) in the appropriate table.

## Checklist

- [ ] Tool file created in the correct category directory
- [ ] Tool function is a pure function with no service dependencies
- [ ] TypeScript types declared for all inputs and outputs
- [ ] Structured result type returned
- [ ] Unit tests written and passing (`pnpm run test`)
- [ ] New dependency added to `package.json` (if applicable)
- [ ] Exported from category `index.ts` (if applicable)
- [ ] Documentation updated in `docs/architecture/tooling-and-macro-tools.md`
