/**
 * @file validationHelpers.ts
 * @description Validation helper functions for common validation patterns in the DEL.
 */

import { z } from 'zod';
import { validateOrThrow } from '../tools/validators/schemaValidator';

/**
 * Validates an email address format.
 * @param email - Email to validate
 * @returns True if valid
 */
export function isValidEmail(email: string): boolean {
  return z.string().email().safeParse(email).success;
}

/**
 * Validates a URL format.
 * @param url - URL to validate
 * @returns True if valid
 */
export function isValidUrl(url: string): boolean {
  return z.string().url().safeParse(url).success;
}

/**
 * Validates a UUID format.
 * @param uuid - UUID to validate
 */
export function isValidUuid(uuid: string): boolean {
  return z.string().uuid().safeParse(uuid).success;
}

/**
 * Validates that a value is a positive integer.
 * @param value - Value to check
 */
export function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/**
 * Validates pagination parameters.
 * @param page - Page number
 * @param limit - Page limit
 * @returns Validated pagination object
 */
export function validatePagination(page: unknown, limit: unknown): { page: number; limit: number } {
  return validateOrThrow(
    z.object({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
    }),
    { page, limit },
  );
}

/**
 * Sanitizes a string for safe storage (trims, removes control chars).
 * @param input - Input string
 * @param maxLength - Optional max length
 * @returns Sanitized string
 */
export function sanitizeString(input: string, maxLength?: number): string {
  let result = input.trim().replace(/[\x00-\x1F\x7F]/g, '');
  if (maxLength) result = result.slice(0, maxLength);
  return result;
}

/**
 * Validates and coerces a date value.
 * @param value - Date string or Date
 * @returns Date object or null
 */
export function validateDate(value: unknown): Date | null {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export default { isValidEmail, isValidUrl, isValidUuid, isPositiveInt, validatePagination, sanitizeString, validateDate };
