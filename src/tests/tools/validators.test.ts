/**
 * @file validators.test.ts
 * @description Tests for validator tools.
 */
import { describe, it, expect } from 'vitest';
import { validateCsv } from '../../tools/validators/csvValidator';
import { validateYaml } from '../../tools/validators/yamlValidator';
import { validateJsonSchema } from '../../tools/validators/jsonSchemaValidator';

describe('Validators', () => {
  it('validates valid CSV', () => { expect(validateCsv('a,b\n1,2').valid).toBe(true); });
  it('rejects CSV with missing header', () => { expect(validateCsv('a,b\n1,2', { requiredHeaders: ['c'] }).valid).toBe(false); });
  it('validates valid YAML', () => { expect(validateYaml('key: value').valid).toBe(true); });
  it('rejects invalid YAML', () => { expect(validateYaml('key: [unclosed').valid).toBe(false); });
  it('validates JSON schema', () => {
    const r = validateJsonSchema({ name: 'Alice', age: 30 }, { type: 'object', required: ['name'], properties: { name: { type: 'string' }, age: { type: 'number' } } });
    expect(r.valid).toBe(true);
  });
  it('fails JSON schema on missing required', () => {
    const r = validateJsonSchema({}, { type: 'object', required: ['name'] });
    expect(r.valid).toBe(false);
  });
});
