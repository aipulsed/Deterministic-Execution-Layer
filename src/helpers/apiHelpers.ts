/**
 * @file apiHelpers.ts
 * @description API utility helpers for building standardized API responses in the DEL.
 */

import { serializeError } from '../services/logger/errorHandler';

/** Standard success response */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

/** Standard error response */
export interface ErrorResponsePayload {
  success: false;
  error: { code: string; message: string; statusCode: number; fields?: Record<string, string[]> };
}

/** Response metadata */
export interface ResponseMeta {
  total?: number;
  page?: number;
  limit?: number;
  hasNextPage?: boolean;
  requestId?: string;
}

/** Paginated response */
export interface PaginatedResponse<T> extends SuccessResponse<T[]> {
  meta: ResponseMeta & { total: number; page: number; limit: number; hasNextPage: boolean };
}

/**
 * Creates a successful API response.
 * @param data - Response data
 * @param meta - Optional metadata
 */
export function successResponse<T>(data: T, meta?: ResponseMeta): SuccessResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

/**
 * Creates an error API response.
 * @param err - Error object
 * @param includeStack - Include stack trace (dev only)
 */
export function errorResponse(err: unknown, includeStack = false): ErrorResponsePayload {
  return serializeError(err, includeStack) as ErrorResponsePayload;
}

/**
 * Creates a paginated API response.
 * @param data - Array of items
 * @param total - Total item count
 * @param page - Current page
 * @param limit - Items per page
 */
export function paginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
  return {
    success: true,
    data,
    meta: {
      total,
      page,
      limit,
      hasNextPage: page * limit < total,
    },
  };
}

/**
 * Parses pagination query parameters.
 * @param query - Query object
 */
export function parsePaginationParams(query: Record<string, unknown>): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(String(query.page ?? '1')) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? '20')) || 20));
  return { page, limit, offset: (page - 1) * limit };
}

export default { successResponse, errorResponse, paginatedResponse, parsePaginationParams };
