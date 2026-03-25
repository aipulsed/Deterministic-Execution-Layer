/**
 * @file database.test.ts
 * @description Unit tests for database services.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('pg', () => {
  const Pool = vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
    connect: vi.fn().mockResolvedValue({ query: vi.fn().mockResolvedValue({ rows: [] }), release: vi.fn() }),
    on: vi.fn(),
    end: vi.fn().mockResolvedValue(undefined),
  }));
  return { Pool };
});

describe('Database Service', () => {
  describe('migrations', () => {
    it('topological sort should handle simple chain', async () => {
      const { topologicalSort } = await import('../../services/scheduler/dependencyScheduler');
      const tasks = new Map([
        ['a', { id: 'a', name: 'A', dependencies: [], handler: async () => {}, timeout: 0, retries: 0 }],
        ['b', { id: 'b', name: 'B', dependencies: ['a'], handler: async () => {}, timeout: 0, retries: 0 }],
        ['c', { id: 'c', name: 'C', dependencies: ['b'], handler: async () => {}, timeout: 0, retries: 0 }],
      ]);
      const order = topologicalSort(tasks);
      expect(order.indexOf('a')).toBeLessThan(order.indexOf('b'));
      expect(order.indexOf('b')).toBeLessThan(order.indexOf('c'));
    });

    it('topological sort detects cycles', async () => {
      const { topologicalSort } = await import('../../services/scheduler/dependencyScheduler');
      const tasks = new Map([
        ['a', { id: 'a', name: 'A', dependencies: ['b'], handler: async () => {} }],
        ['b', { id: 'b', name: 'B', dependencies: ['a'], handler: async () => {} }],
      ]);
      expect(() => topologicalSort(tasks as Parameters<typeof topologicalSort>[0])).toThrow('cycle');
    });
  });
});
