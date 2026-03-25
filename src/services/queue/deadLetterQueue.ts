/**
 * @file deadLetterQueue.ts
 * @description Dead letter queue for storing and managing messages that have
 *              exceeded maximum retry attempts in the DEL.
 */

import { logger } from '../logger/logger';
import { v4 as uuidv4 } from 'uuid';

/** Dead letter message */
export interface DeadLetterMessage<T = unknown> {
  id: string;
  originalId?: string;
  topic?: string;
  operation?: string;
  payload: T;
  error: string;
  attempts: number;
  deadAt: Date;
  metadata?: Record<string, unknown>;
  acknowledged: boolean;
}

/** DLQ stats */
export interface DLQStats {
  total: number;
  acknowledged: number;
  pending: number;
  oldestMessage?: Date;
}

class DeadLetterQueue {
  private messages: Map<string, DeadLetterMessage> = new Map();

  /**
   * Adds a message to the dead letter queue.
   * @param params - Dead letter message parameters
   * @returns DLQ message ID
   */
  enqueue<T>(params: {
    payload: T;
    error: string;
    attempts: number;
    originalId?: string;
    topic?: string;
    operation?: string;
    metadata?: Record<string, unknown>;
  }): string {
    const id = uuidv4();
    const message: DeadLetterMessage<T> = {
      id,
      originalId: params.originalId,
      topic: params.topic,
      operation: params.operation,
      payload: params.payload,
      error: params.error,
      attempts: params.attempts,
      deadAt: new Date(),
      metadata: params.metadata,
      acknowledged: false,
    };

    this.messages.set(id, message as DeadLetterMessage);
    logger.warn(`Message added to DLQ`, undefined, {
      dlqId: id,
      topic: params.topic,
      operation: params.operation,
      error: params.error,
    });

    return id;
  }

  /**
   * Retrieves all unacknowledged DLQ messages.
   * @param limit - Max messages to return
   * @returns Array of dead letter messages
   */
  getMessages(limit = 100): DeadLetterMessage[] {
    return Array.from(this.messages.values())
      .filter((m) => !m.acknowledged)
      .sort((a, b) => a.deadAt.getTime() - b.deadAt.getTime())
      .slice(0, limit);
  }

  /**
   * Retrieves a single DLQ message by ID.
   * @param id - Message ID
   */
  getMessage(id: string): DeadLetterMessage | undefined {
    return this.messages.get(id);
  }

  /**
   * Acknowledges (marks as processed) a DLQ message.
   * @param id - Message ID
   * @returns True if found and acknowledged
   */
  acknowledge(id: string): boolean {
    const msg = this.messages.get(id);
    if (!msg) return false;
    msg.acknowledged = true;
    logger.debug(`DLQ message acknowledged`, undefined, { dlqId: id });
    return true;
  }

  /**
   * Removes acknowledged messages older than the given TTL.
   * @param ttlMs - Time-to-live in milliseconds
   * @returns Number of purged messages
   */
  purgeAcknowledged(ttlMs: number): number {
    const cutoff = Date.now() - ttlMs;
    let count = 0;
    for (const [id, msg] of this.messages) {
      if (msg.acknowledged && msg.deadAt.getTime() < cutoff) {
        this.messages.delete(id);
        count++;
      }
    }
    if (count > 0) logger.info(`Purged ${count} acknowledged DLQ messages`);
    return count;
  }

  /**
   * Returns DLQ statistics.
   */
  getStats(): DLQStats {
    const msgs = Array.from(this.messages.values());
    const pending = msgs.filter((m) => !m.acknowledged);
    return {
      total: msgs.length,
      acknowledged: msgs.length - pending.length,
      pending: pending.length,
      oldestMessage: pending.length > 0
        ? pending.reduce((a, b) => (a.deadAt < b.deadAt ? a : b)).deadAt
        : undefined,
    };
  }

  /**
   * Replays a DLQ message by returning its payload for reprocessing.
   * @param id - Message ID
   * @returns The payload or null if not found
   */
  replay(id: string): unknown {
    const msg = this.messages.get(id);
    if (!msg) return null;
    msg.acknowledged = true;
    logger.info(`Replaying DLQ message`, undefined, { dlqId: id });
    return msg.payload;
  }
}

export const deadLetterQueue = new DeadLetterQueue();
export default deadLetterQueue;
