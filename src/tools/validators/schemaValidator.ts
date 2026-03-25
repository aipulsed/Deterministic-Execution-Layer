/**
 * @file schemaValidator.ts
 * @description Zod-based schema validation for the DEL, providing type-safe
 *              data validation with detailed error reporting.
 */

import { z, ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../../services/logger/errorHandler';

/** Validation result */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
  errorMessage?: string;
}

/**
 * Validates data against a Zod schema.
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validation result
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = formatZodErrors(result.error);
  return { success: false, errors, errorMessage: result.error.message };
}

/**
 * Validates data and throws ValidationError if invalid.
 * @param schema - Zod schema
 * @param data - Data to validate
 * @returns Validated and typed data
 * @throws ValidationError
 */
export function validateOrThrow<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = validate(schema, data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.errors ?? {});
  }
  return result.data!;
}

/**
 * Formats Zod errors into field → messages map.
 * @param error - ZodError instance
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_root';
    (fields[field] ??= []).push(issue.message);
  }
  return fields;
}

// Common reusable schemas
export const schemas = {
  email: z.string().email('Invalid email address'),
  uuid: z.string().uuid('Invalid UUID'),
  url: z.string().url('Invalid URL'),
  positiveInt: z.number().int().positive(),
  nonEmptyString: z.string().min(1, 'Must not be empty'),
  isoDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  pagination: z.object({
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(20),
  }),
};

export { z };
export default { validate, validateOrThrow, formatZodErrors, schemas };
