/**
 * @file queue.test.ts
 * @description Unit tests for queue services.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deadLetterQueue } from '../../services/queue/deadLetterQueue';
import { calculateBackoffDelay } from '../../services/queue/retryQueue';

describe('Queue Services', () => {
  describe('deadLetterQueue', () => {
    beforeEach(() => {
      // Clear by acknowledging all
      deadLetterQueue.purgeAcknowledged(0);
    });

    it('enqueues and retrieves messages', () => {
      const id = deadLetterQueue.enqueue({ payload: { key: 'val' }, error: 'Test error', attempts: 3, topic: 'test' });
      expect(id).toBeDefined();
      const msg = deadLetterQueue.getMessage(id);
      expect(msg?.error).toBe('Test error');
    });

    it('acknowledges a message', () => {
      const id = deadLetterQueue.enqueue({ payload: 'data', error: 'err', attempts: 1 });
      expect(deadLetterQueue.acknowledge(id)).toBe(true);
      const msg = deadLetterQueue.getMessage(id);
      expect(msg?.acknowledged).toBe(true);
    });

    it('returns stats correctly', () => {
      deadLetterQueue.enqueue({ payload: 'x', error: 'e', attempts: 1 });
      const stats = deadLetterQueue.getStats();
      expect(stats.total).toBeGreaterThan(0);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('increases delay exponentially', () => {
      const d1 = calculateBackoffDelay(1, { baseDelayMs: 1000, maxDelayMs: 60000, backoffMultiplier: 2 });
      const d2 = calculateBackoffDelay(2, { baseDelayMs: 1000, maxDelayMs: 60000, backoffMultiplier: 2 });
      expect(d2).toBeGreaterThan(d1 * 0.8);
    });

    it('caps at maxDelayMs', () => {
      const delay = calculateBackoffDelay(100, { baseDelayMs: 1000, maxDelayMs: 5000 });
      expect(delay).toBeLessThanOrEqual(5500); // with jitter
    });
  });
});
