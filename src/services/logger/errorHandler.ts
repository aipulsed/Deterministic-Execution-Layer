/**
 * @file errorHandler.ts
 * @description Global error handler, custom error classes (AppError, ValidationError, NotFoundError),
 *              and error middleware for the Deterministic Execution Layer.
 */

import { logger } from './logger';

/** HTTP-aware application error */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(message: string, statusCode = 500, code?: string, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Validation error for input schema failures */
export class ValidationError extends AppError {
  public readonly fields: Record<string, string[]>;

  constructor(message: string, fields: Record<string, string[]> = {}) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

/** Not found error for missing resources */
export class NotFoundError extends AppError {
  public readonly resource: string;

  constructor(resource: string, id?: string | number) {
    const msg = id ? `${resource} with id '${id}' not found` : `${resource} not found`;
    super(msg, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
    this.resource = resource;
  }
}

/** Unauthorized error */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

/** Forbidden error */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

/** Conflict error for duplicate resource creation */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/** Rate limit error */
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter = 60) {
    super('Too many requests', 429, 'RATE_LIMIT_EXCEEDED');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/** Standardized error response shape */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    statusCode: number;
    fields?: Record<string, string[]>;
    stack?: string;
  };
}

/**
 * Serializes any error into a standardized ErrorResponse.
 * @param err - The error to serialize
 * @param includeStack - Whether to include the stack trace
 * @returns Standardized error response
 */
export function serializeError(err: unknown, includeStack = false): ErrorResponse {
  if (err instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: err.code ?? 'VALIDATION_ERROR',
        message: err.message,
        statusCode: err.statusCode,
        fields: err.fields,
        ...(includeStack ? { stack: err.stack } : {}),
      },
    };
  }

  if (err instanceof AppError) {
    return {
      success: false,
      error: {
        code: err.code ?? 'APP_ERROR',
        message: err.message,
        statusCode: err.statusCode,
        ...(includeStack ? { stack: err.stack } : {}),
      },
    };
  }

  const message = err instanceof Error ? err.message : 'Internal server error';
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      statusCode: 500,
      ...(includeStack && err instanceof Error ? { stack: err.stack } : {}),
    },
  };
}

/**
 * Determines if an error is an operational (expected) error vs a programming bug.
 * @param err - The error to check
 * @returns True if operational
 */
export function isOperationalError(err: unknown): boolean {
  if (err instanceof AppError) return err.isOperational;
  return false;
}

/**
 * Global uncaught exception and unhandled rejection handler.
 * Logs the error and optionally exits the process for non-operational errors.
 */
export function registerGlobalErrorHandlers(): void {
  process.on('uncaughtException', (err: Error) => {
    logger.error('Uncaught exception', err);
    if (!isOperationalError(err)) {
      logger.error('Non-operational error detected, shutting down', err);
      process.exit(1);
    }
  });

  process.on('unhandledRejection', (reason: unknown) => {
    const err = reason instanceof Error ? reason : new Error(String(reason));
    logger.error('Unhandled promise rejection', err);
    if (!isOperationalError(err)) {
      process.exit(1);
    }
  });

  logger.info('Global error handlers registered');
}

export default {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  serializeError,
  isOperationalError,
  registerGlobalErrorHandlers,
};
