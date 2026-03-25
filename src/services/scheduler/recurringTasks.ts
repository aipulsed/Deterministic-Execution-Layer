/**
 * @file recurringTasks.ts
 * @description Recurring task management with interval-based scheduling,
 *              pause/resume, and execution history tracking.
 */

import { logger } from '../logger/logger';
import { v4 as uuidv4 } from 'uuid';

/** Recurring task definition */
export interface RecurringTask {
  id: string;
  name: string;
  intervalMs: number;
  handler: () => Promise<void>;
  enabled: boolean;
  runCount: number;
  errorCount: number;
  lastRunAt?: Date;
  lastDurationMs?: number;
  lastError?: string;
}

const tasks = new Map<string, RecurringTask>();
const intervals = new Map<string, NodeJS.Timeout>();

/**
 * Creates and starts a recurring task.
 * @param name - Task name
 * @param intervalMs - Interval in milliseconds
 * @param handler - Async handler
 * @param options - Task options
 * @returns Task ID
 */
export function createRecurringTask(
  name: string,
  intervalMs: number,
  handler: () => Promise<void>,
  options: { enabled?: boolean; runImmediately?: boolean } = {},
): string {
  const id = uuidv4();
  const task: RecurringTask = {
    id,
    name,
    intervalMs,
    handler,
    enabled: options.enabled ?? true,
    runCount: 0,
    errorCount: 0,
  };

  tasks.set(id, task);

  if (task.enabled) {
    startTask(id);
    if (options.runImmediately) {
      runTask(id);
    }
  }

  logger.info(`Recurring task created: ${name}`, undefined, { taskId: id, intervalMs });
  return id;
}

function startTask(id: string): void {
  const task = tasks.get(id);
  if (!task) return;
  const handle = setInterval(() => runTask(id), task.intervalMs);
  if (handle.unref) handle.unref();
  intervals.set(id, handle);
}

async function runTask(id: string): Promise<void> {
  const task = tasks.get(id);
  if (!task || !task.enabled) return;

  const start = Date.now();
  task.lastRunAt = new Date();
  task.runCount++;

  try {
    await task.handler();
    task.lastDurationMs = Date.now() - start;
    logger.debug(`Recurring task completed: ${task.name}`, undefined, { duration: task.lastDurationMs });
  } catch (err) {
    task.errorCount++;
    task.lastError = err instanceof Error ? err.message : String(err);
    task.lastDurationMs = Date.now() - start;
    logger.error(`Recurring task failed: ${task.name}`, err);
  }
}

/**
 * Pauses a recurring task.
 * @param id - Task ID
 */
export function pauseTask(id: string): void {
  const task = tasks.get(id);
  if (!task) throw new Error(`Task ${id} not found`);
  task.enabled = false;
  const handle = intervals.get(id);
  if (handle) { clearInterval(handle); intervals.delete(id); }
  logger.info(`Recurring task paused: ${task.name}`);
}

/**
 * Resumes a paused recurring task.
 * @param id - Task ID
 */
export function resumeTask(id: string): void {
  const task = tasks.get(id);
  if (!task) throw new Error(`Task ${id} not found`);
  task.enabled = true;
  startTask(id);
  logger.info(`Recurring task resumed: ${task.name}`);
}

/**
 * Removes a recurring task.
 * @param id - Task ID
 */
export function removeTask(id: string): void {
  pauseTask(id);
  tasks.delete(id);
}

/**
 * Returns all registered tasks with their status.
 */
export function getAllTasks(): RecurringTask[] {
  return Array.from(tasks.values());
}

export default { createRecurringTask, pauseTask, resumeTask, removeTask, getAllTasks };
