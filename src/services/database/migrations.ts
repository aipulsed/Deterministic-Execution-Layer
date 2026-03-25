/**
 * @file migrations.ts
 * @description Database migrations runner and schema management for the DEL.
 *              Tracks applied migrations in a migrations table and applies pending ones.
 */

import { query, withTransaction } from './postgresService';
import { logger } from '../logger/logger';

/** Migration definition */
export interface Migration {
  version: number;
  name: string;
  up: string;
  down: string;
}

/** Migration run record */
export interface MigrationRecord {
  version: number;
  name: string;
  appliedAt: Date;
  checksum: string;
}

/** Built-in migrations for the DEL schema */
const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: 'create_jobs_table',
    up: `
      CREATE TABLE IF NOT EXISTS jobs (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        type        TEXT        NOT NULL,
        payload     JSONB       NOT NULL DEFAULT '{}',
        status      TEXT        NOT NULL DEFAULT 'pending',
        priority    INTEGER     NOT NULL DEFAULT 0,
        attempts    INTEGER     NOT NULL DEFAULT 0,
        max_attempts INTEGER    NOT NULL DEFAULT 3,
        scheduled_at TIMESTAMPTZ,
        started_at  TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        failed_at   TIMESTAMPTZ,
        error       TEXT,
        result      JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs (status);
      CREATE INDEX IF NOT EXISTS jobs_type_idx ON jobs (type);
      CREATE INDEX IF NOT EXISTS jobs_scheduled_at_idx ON jobs (scheduled_at);
    `,
    down: 'DROP TABLE IF EXISTS jobs;',
  },
  {
    version: 2,
    name: 'create_pipelines_table',
    up: `
      CREATE TABLE IF NOT EXISTS pipelines (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT        NOT NULL,
        status      TEXT        NOT NULL DEFAULT 'pending',
        context     JSONB       NOT NULL DEFAULT '{}',
        started_at  TIMESTAMPTZ,
        completed_at TIMESTAMPTZ,
        error       TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    down: 'DROP TABLE IF EXISTS pipelines;',
  },
  {
    version: 3,
    name: 'create_audit_log_table',
    up: `
      CREATE TABLE IF NOT EXISTS audit_log (
        audit_id        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        category        TEXT        NOT NULL,
        action          TEXT        NOT NULL,
        actor_user_id   TEXT,
        actor_username  TEXT,
        actor_ip        TEXT,
        resource_type   TEXT,
        resource_id     TEXT,
        outcome         TEXT        NOT NULL,
        severity        TEXT        NOT NULL,
        details         JSONB,
        correlation_id  TEXT
      );
      CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log (actor_user_id);
      CREATE INDEX IF NOT EXISTS audit_log_category_idx ON audit_log (category);
      CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx ON audit_log (timestamp);
    `,
    down: 'DROP TABLE IF EXISTS audit_log;',
  },
];

/**
 * Ensures the migrations tracking table exists.
 */
async function ensureMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version     INTEGER     PRIMARY KEY,
      name        TEXT        NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      checksum    TEXT        NOT NULL
    )
  `);
}

/**
 * Returns the list of applied migration versions.
 */
async function getAppliedMigrations(): Promise<Set<number>> {
  const result = await query<{ version: number }>('SELECT version FROM schema_migrations ORDER BY version');
  return new Set(result.rows.map((r) => r.version));
}

/**
 * Computes a simple checksum for a migration.
 */
function computeChecksum(migration: Migration): string {
  return Buffer.from(`${migration.version}:${migration.name}:${migration.up}`).toString('base64').slice(0, 16);
}

/**
 * Runs all pending migrations.
 * @returns Number of migrations applied
 */
export async function runMigrations(): Promise<number> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const pending = MIGRATIONS.filter((m) => !applied.has(m.version)).sort((a, b) => a.version - b.version);

  if (pending.length === 0) {
    logger.info('No pending migrations');
    return 0;
  }

  let count = 0;
  for (const migration of pending) {
    await withTransaction(async (client) => {
      logger.info(`Applying migration ${migration.version}: ${migration.name}`);
      await client.query(migration.up);
      await client.query(
        'INSERT INTO schema_migrations (version, name, checksum) VALUES ($1, $2, $3)',
        [migration.version, migration.name, computeChecksum(migration)],
      );
    });
    count++;
  }

  logger.info(`Applied ${count} migration(s)`);
  return count;
}

/**
 * Rolls back the last N migrations.
 * @param steps - Number of migrations to roll back
 * @returns Number of migrations rolled back
 */
export async function rollbackMigrations(steps = 1): Promise<number> {
  await ensureMigrationsTable();
  const applied = await getAppliedMigrations();
  const toRollback = MIGRATIONS.filter((m) => applied.has(m.version))
    .sort((a, b) => b.version - a.version)
    .slice(0, steps);

  for (const migration of toRollback) {
    await withTransaction(async (client) => {
      logger.info(`Rolling back migration ${migration.version}: ${migration.name}`);
      await client.query(migration.down);
      await client.query('DELETE FROM schema_migrations WHERE version = $1', [migration.version]);
    });
  }

  return toRollback.length;
}

/**
 * Returns the list of all migration records.
 */
export async function getMigrationStatus(): Promise<MigrationRecord[]> {
  await ensureMigrationsTable();
  const result = await query<{
    version: number;
    name: string;
    applied_at: Date;
    checksum: string;
  }>('SELECT * FROM schema_migrations ORDER BY version');

  return result.rows.map((r) => ({
    version: r.version,
    name: r.name,
    appliedAt: r.applied_at,
    checksum: r.checksum,
  }));
}

export default { runMigrations, rollbackMigrations, getMigrationStatus };
