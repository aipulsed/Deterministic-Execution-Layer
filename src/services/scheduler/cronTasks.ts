/**
 * @file cronTasks.ts
 * @description Predefined cron task definitions for system maintenance, cleanup,
 *              and reporting operations in the DEL.
 */

import { scheduleCronJob } from './jobScheduler';
import { logger } from '../logger/logger';

/** System cleanup task - runs daily at midnight */
export async function registerCleanupTask(): Promise<string> {
  return scheduleCronJob(
    'daily-cleanup',
    '0 0 * * *',
    async () => {
      logger.info('Running daily cleanup task');
      // Cleanup temp files, expired tokens, old logs, etc.
    },
    { enabled: true },
  );
}

/** Health check ping - runs every 5 minutes */
export async function registerHealthCheckTask(): Promise<string> {
  return scheduleCronJob(
    'health-check',
    '*/5 * * * *',
    async () => {
      logger.debug('Health check ping');
    },
    { enabled: true },
  );
}

/** DLQ purge task - runs every hour */
export async function registerDLQPurgeTask(): Promise<string> {
  return scheduleCronJob(
    'dlq-purge',
    '0 * * * *',
    async () => {
      logger.info('Purging acknowledged DLQ messages');
      const { deadLetterQueue } = await import('../queue/deadLetterQueue');
      deadLetterQueue.purgeAcknowledged(86400 * 1000);
    },
    { enabled: true },
  );
}

/** Weekly report generation - runs every Monday at 8am */
export async function registerWeeklyReportTask(): Promise<string> {
  return scheduleCronJob(
    'weekly-report',
    '0 8 * * 1',
    async () => {
      logger.info('Generating weekly report');
    },
    { enabled: true },
  );
}

/**
 * Registers all default system cron tasks.
 */
export async function registerAllCronTasks(): Promise<string[]> {
  const ids = await Promise.all([
    registerCleanupTask(),
    registerHealthCheckTask(),
    registerDLQPurgeTask(),
    registerWeeklyReportTask(),
  ]);
  logger.info(`Registered ${ids.length} cron tasks`);
  return ids;
}

export default { registerAllCronTasks, registerCleanupTask, registerHealthCheckTask, registerDLQPurgeTask, registerWeeklyReportTask };
