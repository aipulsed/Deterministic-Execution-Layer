/**
 * @file taskQueue.ts
 * @description Task queue for background job processing with priority support,
 *              concurrency control, and job lifecycle management.
 */

import { EventEmitter } from 'events';
import { logger } from '../logger/logger';
import { v4 as uuidv4 } from 'uuid';

/** Job status */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/** Job definition */
export interface Job<T = unknown, R = unknown> {
  id: string;
  type: string;
  payload: T;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  result?: R;
  error?: string;
}

/** Job handler function */
export type JobHandler<T = unknown, R = unknown> = (job: Job<T, R>) => Promise<R>;

/** Task queue options */
export interface TaskQueueOptions {
  concurrency?: number;
  defaultMaxAttempts?: number;
}

class TaskQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private queue: string[] = [];
  private handlers: Map<string, JobHandler> = new Map();
  private running = 0;
  private readonly concurrency: number;
  private readonly defaultMaxAttempts: number;

  constructor(options: TaskQueueOptions = {}) {
    super();
    this.concurrency = options.concurrency ?? 5;
    this.defaultMaxAttempts = options.defaultMaxAttempts ?? 3;
  }

  /**
   * Registers a handler for a job type.
   * @param type - Job type identifier
   * @param handler - Async handler function
   */
  registerHandler<T, R>(type: string, handler: JobHandler<T, R>): void {
    this.handlers.set(type, handler as JobHandler);
    logger.debug(`Handler registered for job type '${type}'`);
  }

  /**
   * Adds a job to the queue.
   * @param type - Job type
   * @param payload - Job payload
   * @param options - Job options
   * @returns Job ID
   */
  async enqueue<T>(
    type: string,
    payload: T,
    options: { priority?: number; maxAttempts?: number } = {},
  ): Promise<string> {
    const job: Job<T> = {
      id: uuidv4(),
      type,
      payload,
      status: 'pending',
      priority: options.priority ?? 0,
      attempts: 0,
      maxAttempts: options.maxAttempts ?? this.defaultMaxAttempts,
      createdAt: new Date(),
    };

    this.jobs.set(job.id, job as Job);
    this.insertByPriority(job.id, job.priority);
    logger.debug(`Job enqueued`, undefined, { jobId: job.id, type, priority: job.priority });
    this.emit('job:enqueued', job);

    setImmediate(() => this.processNext());
    return job.id;
  }

  private insertByPriority(jobId: string, priority: number): void {
    const idx = this.queue.findIndex((id) => {
      const j = this.jobs.get(id);
      return j ? j.priority < priority : false;
    });
    if (idx === -1) {
      this.queue.push(jobId);
    } else {
      this.queue.splice(idx, 0, jobId);
    }
  }

  private async processNext(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) return;

    const jobId = this.queue.shift()!;
    const job = this.jobs.get(jobId);
    if (!job) return;

    const handler = this.handlers.get(job.type);
    if (!handler) {
      job.status = 'failed';
      job.error = `No handler registered for job type '${job.type}'`;
      logger.error(job.error);
      return;
    }

    this.running++;
    job.status = 'running';
    job.startedAt = new Date();
    job.attempts++;
    this.emit('job:started', job);

    try {
      const result = await handler(job);
      job.status = 'completed';
      job.completedAt = new Date();
      job.result = result;
      logger.debug(`Job completed`, undefined, { jobId });
      this.emit('job:completed', job);
    } catch (err) {
      job.error = err instanceof Error ? err.message : String(err);
      if (job.attempts < job.maxAttempts) {
        job.status = 'pending';
        this.queue.push(jobId);
        logger.warn(`Job failed, will retry`, undefined, { jobId, attempts: job.attempts });
        this.emit('job:retry', job);
      } else {
        job.status = 'failed';
        job.completedAt = new Date();
        logger.error(`Job failed permanently`, err);
        this.emit('job:failed', job);
      }
    } finally {
      this.running--;
      setImmediate(() => this.processNext());
    }
  }

  /** Returns a job by ID */
  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  /** Returns queue stats */
  getStats() {
    return {
      pending: this.queue.length,
      running: this.running,
      total: this.jobs.size,
    };
  }
}

export const taskQueue = new TaskQueue();
export default taskQueue;
