/**
 * @file queueEmail.ts
 * @description Email queuing service that buffers email sends and processes them
 *              asynchronously with rate limiting and retry support.
 */

import { sendEmailWithRetry, EmailMessage, EmailResult } from './sendEmail';
import { logger } from '../logger/logger';
import { v4 as uuidv4 } from 'uuid';

/** Queued email item */
export interface QueuedEmail {
  id: string;
  message: EmailMessage;
  status: 'pending' | 'sending' | 'sent' | 'failed';
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  sentAt?: Date;
  error?: string;
  result?: EmailResult;
}

/** Email queue stats */
export interface EmailQueueStats {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  total: number;
}

const emailQueue: Map<string, QueuedEmail> = new Map();
let isProcessing = false;
const RATE_LIMIT_MS = 100;

/**
 * Adds an email to the send queue.
 * @param message - Email message to queue
 * @param options - Queue options
 * @returns Queue item ID
 */
export async function queueEmail(
  message: EmailMessage,
  options: { scheduledAt?: Date; maxAttempts?: number } = {},
): Promise<string> {
  const id = uuidv4();
  const item: QueuedEmail = {
    id,
    message,
    status: 'pending',
    attempts: 0,
    maxAttempts: options.maxAttempts ?? 3,
    scheduledAt: options.scheduledAt ?? new Date(),
  };

  emailQueue.set(id, item);
  logger.debug('Email queued', undefined, { queueId: id, subject: message.subject });

  if (!isProcessing) {
    setImmediate(() => processQueue());
  }

  return id;
}

/**
 * Processes all pending emails in the queue.
 */
export async function processQueue(): Promise<void> {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();
    for (const [id, item] of emailQueue) {
      if (item.status !== 'pending' || item.scheduledAt > now) continue;

      item.status = 'sending';
      item.attempts++;

      try {
        const result = await sendEmailWithRetry(item.message, item.maxAttempts);
        item.status = 'sent';
        item.sentAt = new Date();
        item.result = result;
        logger.info('Queued email sent', undefined, { queueId: id });
      } catch (err) {
        item.status = item.attempts >= item.maxAttempts ? 'failed' : 'pending';
        item.error = err instanceof Error ? err.message : String(err);
        logger.error('Queued email failed', err);
      }

      await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
    }
  } finally {
    isProcessing = false;
  }
}

/**
 * Returns the status of a queued email.
 * @param id - Queue item ID
 */
export function getQueuedEmailStatus(id: string): QueuedEmail | undefined {
  return emailQueue.get(id);
}

/**
 * Returns email queue statistics.
 */
export function getEmailQueueStats(): EmailQueueStats {
  const items = Array.from(emailQueue.values());
  return {
    pending: items.filter((i) => i.status === 'pending').length,
    sending: items.filter((i) => i.status === 'sending').length,
    sent: items.filter((i) => i.status === 'sent').length,
    failed: items.filter((i) => i.status === 'failed').length,
    total: items.length,
  };
}

export default { queueEmail, processQueue, getQueuedEmailStatus, getEmailQueueStats };
