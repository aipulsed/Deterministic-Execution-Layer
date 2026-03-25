/**
 * @file postgresService.ts
 * @description PostgreSQL service with connection pooling, query execution,
 *              and transaction support for the Deterministic Execution Layer.
 */

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../logger/logger';

/** Database connection configuration */
export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  max?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | { rejectUnauthorized: boolean };
}

/** Query parameter types */
export type QueryParams = (string | number | boolean | null | Date | Buffer | object)[];

/** Transaction callback function type */
export type TransactionCallback<T> = (client: PoolClient) => Promise<T>;

let pool: Pool | null = null;

/**
 * Initializes the PostgreSQL connection pool.
 * @param config - Database configuration
 */
export async function initializePool(config: DatabaseConfig): Promise<void> {
  try {
    pool = new Pool({
      connectionString: config.connectionString,
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      max: config.max ?? 10,
      idleTimeoutMillis: config.idleTimeoutMillis ?? 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis ?? 5000,
      ssl: config.ssl,
    });

    pool.on('error', (err) => {
      logger.error('PostgreSQL pool error', err);
    });

    // Test the connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    logger.info('PostgreSQL pool initialized');
  } catch (err) {
    logger.error('Failed to initialize PostgreSQL pool', err);
    throw err;
  }
}

/**
 * Returns the active connection pool.
 * @throws Error if pool is not initialized
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('PostgreSQL pool is not initialized. Call initializePool() first.');
  }
  return pool;
}

/**
 * Executes a parameterized SQL query.
 * @param sql - SQL query string
 * @param params - Query parameters
 * @returns Query result
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: QueryParams,
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await getPool().query<T>(sql, params);
    const duration = Date.now() - start;
    logger.debug('Query executed', undefined, { sql: sql.slice(0, 100), duration, rows: result.rowCount });
    return result;
  } catch (err) {
    logger.error('Query failed', err, undefined);
    throw err;
  }
}

/**
 * Executes a query and returns the first row or null.
 * @param sql - SQL query string
 * @param params - Query parameters
 * @returns First row or null
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  sql: string,
  params?: QueryParams,
): Promise<T | null> {
  const result = await query<T>(sql, params);
  return result.rows[0] ?? null;
}

/**
 * Executes multiple queries within a transaction.
 * @param callback - Async function receiving the client
 * @returns Result of the callback
 */
export async function withTransaction<T>(callback: TransactionCallback<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Executes a batch insert.
 * @param table - Target table name
 * @param columns - Column names
 * @param rows - Array of row value arrays
 * @returns Number of inserted rows
 */
export async function batchInsert(
  table: string,
  columns: string[],
  rows: QueryParams[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const placeholders = rows
    .map((_, rowIndex) =>
      `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`,
    )
    .join(', ');

  const values = rows.flat();
  const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders}`;

  const result = await query(sql, values);
  return result.rowCount ?? 0;
}

/**
 * Closes the connection pool gracefully.
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('PostgreSQL pool closed');
  }
}

export default { initializePool, getPool, query, queryOne, withTransaction, batchInsert, closePool };
