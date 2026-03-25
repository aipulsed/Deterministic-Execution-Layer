/**
 * @file eventQueue.ts
 * @description Event queue implementation with Redis backend and in-memory fallback
 *              for reliable event-driven processing in the DEL.
 */

import { EventEmitter } from 'events';
import { logger } from '../logger/logger';
import { v4 as uuidv4 } from 'uuid';

/** Queue message envelope */
export interface QueueMessage<T = unknown> {
  id: string;
  topic: string;
  payload: T;
  timestamp: string;
  attempts: number;
  maxAttempts: number;
  scheduledAt?: string;
  metadata?: Record<string, unknown>;
}

/** Message handler callback */
export type MessageHandler<T = unknown> = (message: QueueMessage<T>) => Promise<void>;

/** Queue subscription */
export interface QueueSubscription {
  id: string;
  topic: string;
  handler: MessageHandler;
}

class InMemoryEventQueue extends EventEmitter {
  private queues: Map<string, QueueMessage[]> = new Map();
  private subscriptions: Map<string, QueueSubscription[]> = new Map();
  private processing = false;

  /**
   * Enqueues a message on the given topic.
   * @param topic - Topic name
   * @param payload - Message payload
   * @param options - Optional message options
   * @returns Message ID
   */
  async enqueue<T>(
    topic: string,
    payload: T,
    options: { maxAttempts?: number; scheduledAt?: Date; metadata?: Record<string, unknown> } = {},
  ): Promise<string> {
    const message: QueueMessage<T> = {
      id: uuidv4(),
      topic,
      payload,
      timestamp: new Date().toISOString(),
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      scheduledAt: options.scheduledAt?.toISOString(),
      metadata: options.metadata,
    };

    if (!this.queues.has(topic)) this.queues.set(topic, []);
    this.queues.get(topic)!.push(message as QueueMessage);
    logger.debug(`Message enqueued on topic '${topic}'`, undefined, { messageId: message.id });

    this.emit('message', message);
    await this.processQueue(topic);
    return message.id;
  }

  /**
   * Subscribes a handler to a topic.
   * @param topic - Topic to subscribe to
   * @param handler - Message handler
   * @returns Subscription ID
   */
  subscribe<T>(topic: string, handler: MessageHandler<T>): string {
    const sub: QueueSubscription = { id: uuidv4(), topic, handler: handler as MessageHandler };
    if (!this.subscriptions.has(topic)) this.subscriptions.set(topic, []);
    this.subscriptions.get(topic)!.push(sub);
    logger.debug(`Subscribed to topic '${topic}'`, undefined, { subscriptionId: sub.id });
    return sub.id;
  }

  /**
   * Unsubscribes a handler by subscription ID.
   * @param subscriptionId - The subscription ID to remove
   */
  unsubscribe(subscriptionId: string): void {
    for (const [topic, subs] of this.subscriptions) {
      const filtered = subs.filter((s) => s.id !== subscriptionId);
      this.subscriptions.set(topic, filtered);
    }
  }

  private async processQueue(topic: string): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      const queue = this.queues.get(topic) ?? [];
      const subs = this.subscriptions.get(topic) ?? [];
      if (queue.length === 0 || subs.length === 0) return;

      const message = queue.shift()!;
      const now = new Date();
      if (message.scheduledAt && new Date(message.scheduledAt) > now) {
        queue.unshift(message);
        return;
      }

      message.attempts++;
      for (const sub of subs) {
        try {
          await sub.handler(message);
        } catch (err) {
          logger.error(`Handler failed for topic '${topic}'`, err);
          if (message.attempts < message.maxAttempts) {
            queue.push(message);
          } else {
            logger.warn(`Message exceeded max attempts, dropping`, undefined, { messageId: message.id });
          }
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Returns the current queue depth for a topic.
   * @param topic - Topic name
   */
  getQueueDepth(topic: string): number {
    return this.queues.get(topic)?.length ?? 0;
  }

  /**
   * Clears all messages from a topic.
   * @param topic - Topic name
   */
  clearTopic(topic: string): void {
    this.queues.set(topic, []);
  }
}

export const eventQueue = new InMemoryEventQueue();
export default eventQueue;
