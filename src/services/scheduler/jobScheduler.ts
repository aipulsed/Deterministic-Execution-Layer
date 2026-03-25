/**
 * @file jobScheduler.ts
 * @description Job scheduler with cron support for scheduling recurring and one-time
 *              tasks in the Deterministic Execution Layer.
 */

import cron from 'node-cron';
import { logger } from '../logger/logger';
import { v4 as uuidv4 } from 'uuid';

/** Scheduled job definition */
export interface ScheduledJob {
  id: string;
  name: string;
  cronExpression: string;
  handler: () => Promise<void>;
  enabled: boolean;
  lastRunAt?: Date;
  nextRunAt?: Date;
  runCount: number;
  errorCount: number;
  lastError?: string;
}

/** One-time scheduled task */
export interface ScheduledTask {
  id: string;
  name: string;
  runAt: Date;
  handler: () => Promise<void>;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

const jobs = new Map<string, ScheduledJob>();
const tasks = new Map<string, ScheduledTask>();
const cronInstances = new Map<string, cron.ScheduledTask>();

/**
 * Schedules a recurring cron job.
 * @param name - Job name
 * @param cronExpression - Cron expression (e.g., '0 * * * *')
 * @param handler - Async handler function
 * @param options - Job options
 * @returns Job ID
 */
export function scheduleCronJob(
  name: string,
  cronExpression: string,
  handler: () => Promise<void>,
  options: { enabled?: boolean } = {},
): string {
  if (!cron.validate(cronExpression)) {
    throw new Error(`Invalid cron expression: ${cronExpression}`);
  }

  const id = uuidv4();
  const job: ScheduledJob = {
    id,
    name,
    cronExpression,
    handler,
    enabled: options.enabled ?? true,
    runCount: 0,
    errorCount: 0,
  };

  jobs.set(id, job);

  if (job.enabled) {
    const task = cron.schedule(cronExpression, async () => {
      await runJob(id);
    });
    cronInstances.set(id, task);
  }

  logger.info(`Cron job scheduled: ${name}`, undefined, { jobId: id, expression: cronExpression });
  return id;
}

async function runJob(id: string): Promise<void> {
  const job = jobs.get(id);
  if (!job || !job.enabled) return;

  job.lastRunAt = new Date();
  job.runCount++;

  try {
    await job.handler();
    logger.debug(`Cron job completed: ${job.name}`, undefined, { jobId: id });
  } catch (err) {
    job.errorCount++;
    job.lastError = err instanceof Error ? err.message : String(err);
    logger.error(`Cron job failed: ${job.name}`, err);
  }
}

/**
 * Schedules a one-time task at a specific time.
 * @param name - Task name
 * @param runAt - When to run
 * @param handler - Async handler
 * @returns Task ID
 */
export function scheduleOneTimeTask(
  name: string,
  runAt: Date,
  handler: () => Promise<void>,
): string {
  const id = uuidv4();
  const task: ScheduledTask = { id, name, runAt, handler, status: 'pending' };
  tasks.set(id, task);

  const delay = runAt.getTime() - Date.now();
  if (delay <= 0) {
    setImmediate(() => runOneTimeTask(id));
  } else {
    setTimeout(() => runOneTimeTask(id), delay);
  }

  logger.info(`One-time task scheduled: ${name}`, undefined, { taskId: id, runAt });
  return id;
}

async function runOneTimeTask(id: string): Promise<void> {
  const task = tasks.get(id);
  if (!task || task.status !== 'pending') return;

  task.status = 'running';
  try {
    await task.handler();
    task.status = 'completed';
    logger.debug(`One-time task completed: ${task.name}`);
  } catch (err) {
    task.status = 'failed';
    logger.error(`One-time task failed: ${task.name}`, err);
  }
}

/**
 * Pauses a scheduled cron job.
 * @param jobId - Job ID
 */
export function pauseJob(jobId: string): void {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  job.enabled = false;
  cronInstances.get(jobId)?.stop();
  logger.info(`Cron job paused: ${job.name}`);
}

/**
 * Resumes a paused cron job.
 * @param jobId - Job ID
 */
export function resumeJob(jobId: string): void {
  const job = jobs.get(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);
  job.enabled = true;
  cronInstances.get(jobId)?.start();
  logger.info(`Cron job resumed: ${job.name}`);
}

/**
 * Returns all registered jobs.
 */
export function getJobs(): ScheduledJob[] {
  return Array.from(jobs.values());
}

/**
 * Stops all scheduled jobs.
 */
export function stopAll(): void {
  for (const task of cronInstances.values()) task.stop();
  cronInstances.clear();
  logger.info('All scheduled jobs stopped');
}

export default { scheduleCronJob, scheduleOneTimeTask, pauseJob, resumeJob, getJobs, stopAll };
