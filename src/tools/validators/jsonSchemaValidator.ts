/**
 * @file jsonSchemaValidator.ts
 * @description JSON Schema (Draft-07) validation for the DEL.
 */

export interface JsonSchema {
  type?: string | string[];
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  additionalProperties?: boolean | JsonSchema;
  [key: string]: unknown;
}

export interface JsonValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a JSON value against a JSON Schema.
 * @param data - Data to validate
 * @param schema - JSON Schema definition
 * @param path - Current path for error messages
 * @returns Validation result
 */
export function validateJsonSchema(
  data: unknown,
  schema: JsonSchema,
  path = '$',
): JsonValidationResult {
  const errors: string[] = [];

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    const actualType = getJsonType(data);
    if (!types.includes(actualType) && !(data === null && types.includes('null'))) {
      errors.push(`${path}: expected type '${types.join('|')}', got '${actualType}'`);
      return { valid: false, errors };
    }
  }

  if (schema.enum !== undefined && !schema.enum.some((v) => JSON.stringify(v) === JSON.stringify(data))) {
    errors.push(`${path}: value must be one of [${schema.enum.map((v) => JSON.stringify(v)).join(', ')}]`);
  }

  if (typeof data === 'string') {
    if (schema.minLength !== undefined && data.length < schema.minLength)
      errors.push(`${path}: string length ${data.length} < minLength ${schema.minLength}`);
    if (schema.maxLength !== undefined && data.length > schema.maxLength)
      errors.push(`${path}: string length ${data.length} > maxLength ${schema.maxLength}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(data))
      errors.push(`${path}: string does not match pattern '${schema.pattern}'`);
  }

  if (typeof data === 'number') {
    if (schema.minimum !== undefined && data < schema.minimum)
      errors.push(`${path}: ${data} < minimum ${schema.minimum}`);
    if (schema.maximum !== undefined && data > schema.maximum)
      errors.push(`${path}: ${data} > maximum ${schema.maximum}`);
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const obj = data as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in obj)) errors.push(`${path}: missing required property '${key}'`);
    }
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in obj) {
          const sub = validateJsonSchema(obj[key], propSchema, `${path}.${key}`);
          errors.push(...sub.errors);
        }
      }
    }
  }

  if (Array.isArray(data) && schema.items) {
    data.forEach((item, i) => {
      const sub = validateJsonSchema(item, schema.items!, `${path}[${i}]`);
      errors.push(...sub.errors);
    });
  }

  return { valid: errors.length === 0, errors };
}

function getJsonType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

export default { validateJsonSchema };
