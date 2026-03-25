/**
 * @file retryQueue.ts
 * @description Retry queue with exponential backoff for transient failures
 *              in the Deterministic Execution Layer.
 */

import { logger } from '../logger/logger';
import { v4 as uuidv4 } from 'uuid';

/** Retry item */
export interface RetryItem<T = unknown> {
  id: string;
  payload: T;
  operation: string;
  attempts: number;
  maxAttempts: number;
  nextRetryAt: Date;
  lastError?: string;
  createdAt: Date;
}

/** Retry operation handler */
export type RetryHandler<T = unknown, R = unknown> = (payload: T) => Promise<R>;

/** Retry queue options */
export interface RetryQueueOptions {
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  maxAttempts?: number;
}

/**
 * Calculates the next retry delay using exponential backoff with jitter.
 * @param attempt - Current attempt number (1-based)
 * @param options - Backoff options
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(
  attempt: number,
  options: { baseDelayMs?: number; maxDelayMs?: number; backoffMultiplier?: number } = {},
): number {
  const base = options.baseDelayMs ?? 1000;
  const max = options.maxDelayMs ?? 60000;
  const multiplier = options.backoffMultiplier ?? 2;

  const delay = Math.min(base * Math.pow(multiplier, attempt - 1), max);
  // Add jitter (±10%)
  const jitter = delay * 0.1 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

class RetryQueue {
  private items: Map<string, RetryItem> = new Map();
  private handlers: Map<string, RetryHandler> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private readonly options: Required<RetryQueueOptions>;

  constructor(options: RetryQueueOptions = {}) {
    this.options = {
      baseDelayMs: options.baseDelayMs ?? 1000,
      maxDelayMs: options.maxDelayMs ?? 60000,
      backoffMultiplier: options.backoffMultiplier ?? 2,
      maxAttempts: options.maxAttempts ?? 5,
    };
  }

  /**
   * Registers a handler for a named operation.
   * @param operation - Operation name
   * @param handler - Async handler
   */
  registerHandler<T, R>(operation: string, handler: RetryHandler<T, R>): void {
    this.handlers.set(operation, handler as RetryHandler);
  }

  /**
   * Schedules an item for retry.
   * @param operation - Operation name
   * @param payload - Payload to retry with
   * @param options - Retry options
   * @returns Retry item ID
   */
  schedule<T>(
    operation: string,
    payload: T,
    options: { maxAttempts?: number; initialDelayMs?: number } = {},
  ): string {
    const id = uuidv4();
    const delayMs = options.initialDelayMs ?? this.options.baseDelayMs;
    const item: RetryItem<T> = {
      id,
      payload,
      operation,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.options.maxAttempts,
      nextRetryAt: new Date(Date.now() + delayMs),
      createdAt: new Date(),
    };

    this.items.set(id, item as RetryItem);
    logger.debug(`Retry scheduled for '${operation}'`, undefined, { retryId: id, nextRetryAt: item.nextRetryAt });
    this.startTimer();
    return id;
  }

  private startTimer(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.processDue(), 1000);
    if (this.timer.unref) this.timer.unref();
  }

  private async processDue(): Promise<void> {
    const now = new Date();
    for (const [id, item] of this.items) {
      if (item.nextRetryAt <= now) {
        await this.processItem(id, item);
      }
    }
  }

  private async processItem(id: string, item: RetryItem): Promise<void> {
    const handler = this.handlers.get(item.operation);
    if (!handler) {
      logger.error(`No handler for retry operation '${item.operation}'`);
      this.items.delete(id);
      return;
    }

    item.attempts++;
    try {
      await handler(item.payload);
      this.items.delete(id);
      logger.debug(`Retry succeeded for '${item.operation}'`, undefined, { retryId: id });
    } catch (err) {
      item.lastError = err instanceof Error ? err.message : String(err);
      if (item.attempts >= item.maxAttempts) {
        logger.error(`Retry exhausted for '${item.operation}'`, err);
        this.items.delete(id);
      } else {
        const delay = calculateBackoffDelay(item.attempts, this.options);
        item.nextRetryAt = new Date(Date.now() + delay);
        logger.debug(`Retry rescheduled for '${item.operation}'`, undefined, { retryId: id, delay });
      }
    }
  }

  /** Returns the number of pending retry items */
  getPendingCount(): number {
    return this.items.size;
  }

  /** Cancels a scheduled retry */
  cancel(id: string): boolean {
    return this.items.delete(id);
  }

  /** Stops the retry timer */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const retryQueue = new RetryQueue();
export { RetryQueue };
export default retryQueue;
