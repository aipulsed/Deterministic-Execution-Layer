/**
 * @file backupRestore.ts
 * @description Database backup and restore functionality using pg_dump/pg_restore
 *              and S3/local storage for the Deterministic Execution Layer.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger/logger';

/** Backup configuration */
export interface BackupConfig {
  connectionString: string;
  outputDir: string;
  s3Bucket?: string;
  s3Prefix?: string;
  compress?: boolean;
  format?: 'plain' | 'custom' | 'directory' | 'tar';
}

/** Backup result */
export interface BackupResult {
  filename: string;
  filepath: string;
  sizeBytes: number;
  timestamp: string;
  duration: number;
  compressed: boolean;
}

/** Restore options */
export interface RestoreOptions {
  connectionString: string;
  backupFile: string;
  clean?: boolean;
  noOwner?: boolean;
  schema?: string;
}

/**
 * Creates a database backup using pg_dump.
 * @param config - Backup configuration
 * @returns Backup result metadata
 */
export async function createBackup(config: BackupConfig): Promise<BackupResult> {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const extension = config.format === 'custom' ? 'dump' : config.compress ? 'sql.gz' : 'sql';
  const filename = `backup-${timestamp}.${extension}`;
  const filepath = path.join(config.outputDir, filename);

  try {
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    const formatFlag = config.format ? `-F ${config.format[0]}` : '-F p';
    const compressFlag = config.compress && config.format !== 'custom' ? '| gzip' : '';
    const cmd = `pg_dump "${config.connectionString}" ${formatFlag} -f "${filepath}" ${compressFlag}`.trim();

    logger.info('Starting database backup', undefined, { filename });
    execSync(cmd, { stdio: 'pipe' });

    const stat = fs.statSync(filepath);
    const duration = Date.now() - startTime;

    logger.info('Database backup completed', undefined, { filename, sizeBytes: stat.size, duration });

    return {
      filename,
      filepath,
      sizeBytes: stat.size,
      timestamp: new Date().toISOString(),
      duration,
      compressed: config.compress ?? false,
    };
  } catch (err) {
    logger.error('Database backup failed', err);
    throw err;
  }
}

/**
 * Restores a database from a backup file using pg_restore or psql.
 * @param options - Restore options
 */
export async function restoreBackup(options: RestoreOptions): Promise<void> {
  try {
    const ext = path.extname(options.backupFile);
    const cleanFlag = options.clean ? '--clean' : '';
    const noOwnerFlag = options.noOwner ? '--no-owner' : '';
    const schemaFlag = options.schema ? `--schema=${options.schema}` : '';

    let cmd: string;
    if (ext === '.dump') {
      cmd = `pg_restore ${cleanFlag} ${noOwnerFlag} ${schemaFlag} -d "${options.connectionString}" "${options.backupFile}"`;
    } else {
      const catCmd = ext === '.gz' ? `zcat "${options.backupFile}"` : `cat "${options.backupFile}"`;
      cmd = `${catCmd} | psql "${options.connectionString}"`;
    }

    logger.info('Starting database restore', undefined, { backupFile: options.backupFile });
    execSync(cmd.trim(), { stdio: 'pipe' });
    logger.info('Database restore completed');
  } catch (err) {
    logger.error('Database restore failed', err);
    throw err;
  }
}

/**
 * Lists available backup files in the backup directory.
 * @param backupDir - Directory to scan
 * @returns List of backup file paths sorted by creation date
 */
export function listBackups(backupDir: string): string[] {
  if (!fs.existsSync(backupDir)) return [];

  return fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith('backup-') && (f.endsWith('.sql') || f.endsWith('.dump') || f.endsWith('.sql.gz')))
    .map((f) => path.join(backupDir, f))
    .sort();
}

/**
 * Deletes backup files older than the specified number of days.
 * @param backupDir - Directory containing backups
 * @param retentionDays - Number of days to retain
 * @returns Number of deleted files
 */
export function pruneOldBackups(backupDir: string, retentionDays: number): number {
  const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const files = listBackups(backupDir);
  let deleted = 0;

  for (const file of files) {
    const stat = fs.statSync(file);
    if (stat.mtimeMs < cutoff) {
      fs.unlinkSync(file);
      deleted++;
      logger.info('Pruned old backup', undefined, { file });
    }
  }

  return deleted;
}

export default { createBackup, restoreBackup, listBackups, pruneOldBackups };
