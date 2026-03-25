/**
 * @file errorHelpers.ts
 * @description Error handling helpers and utilities for the DEL.
 */

import {
  AppError,
  ValidationError,
  NotFoundError,
  serializeError,
  isOperationalError,
} from '../services/logger/errorHandler';
import { logger } from '../services/logger/logger';

/**
 * Wraps an async function with error handling, logging, and optional retries.
 * @param fn - Async function to wrap
 * @param context - Error context label
 * @param options - Options
 * @returns Result of the function
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string,
  options: { rethrow?: boolean; fallback?: T } = {},
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    logger.error(`Error in ${context}`, err);
    if (options.rethrow !== false) throw err;
    if (options.fallback !== undefined) return options.fallback;
    throw err;
  }
}

/**
 * Converts unknown error to an AppError.
 * @param err - Any error
 * @param statusCode - HTTP status code
 * @returns AppError instance
 */
export function toAppError(err: unknown, statusCode = 500): AppError {
  if (err instanceof AppError) return err;
  const message = err instanceof Error ? err.message : String(err);
  return new AppError(message, statusCode);
}

/**
 * Creates a NotFoundError for a resource.
 * @param resource - Resource name
 * @param id - Resource ID
 */
export function notFound(resource: string, id?: string | number): NotFoundError {
  return new NotFoundError(resource, id);
}

/**
 * Creates a ValidationError from a field errors map.
 * @param message - Error message
 * @param fields - Field errors
 */
export function validationError(message: string, fields: Record<string, string[]>): ValidationError {
  return new ValidationError(message, fields);
}

/**
 * Safely executes a function, returning [result, null] or [null, error].
 * @param fn - Function to execute
 * @returns Tuple of [result, error]
 */
export async function safeExecute<T>(
  fn: () => Promise<T>,
): Promise<[T, null] | [null, Error]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (err) {
    return [null, err instanceof Error ? err : new Error(String(err))];
  }
}

export { serializeError, isOperationalError };
export default { withErrorHandling, toAppError, notFound, validationError, safeExecute };
