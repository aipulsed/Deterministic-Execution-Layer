/**
 * @file vectorStore.ts
 * @description Vector store service for storing and querying high-dimensional embeddings
 *              with cosine similarity search. Supports pgvector extension in PostgreSQL.
 */

import { query, withTransaction } from './postgresService';
import { logger } from '../logger/logger';

/** Vector embedding record */
export interface VectorRecord {
  id: string;
  namespace: string;
  vector: number[];
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

/** Vector similarity search result */
export interface VectorSearchResult {
  id: string;
  namespace: string;
  metadata?: Record<string, unknown>;
  similarity: number;
  createdAt: Date;
}

/** Upsert options for vector storage */
export interface VectorUpsertOptions {
  id: string;
  namespace: string;
  vector: number[];
  metadata?: Record<string, unknown>;
}

/**
 * Ensures the vector store table and pgvector extension exist.
 */
export async function initializeVectorStore(): Promise<void> {
  try {
    await query(`CREATE EXTENSION IF NOT EXISTS vector`);
    await query(`
      CREATE TABLE IF NOT EXISTS vector_store (
        id          TEXT        NOT NULL,
        namespace   TEXT        NOT NULL,
        vector      vector(1536),
        metadata    JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (id, namespace)
      )
    `);
    await query(`
      CREATE INDEX IF NOT EXISTS vector_store_hnsw_idx
      ON vector_store USING hnsw (vector vector_cosine_ops)
      WITH (m = 16, ef_construction = 64)
    `);
    logger.info('Vector store initialized');
  } catch (err) {
    logger.warn('Vector store initialization (pgvector may not be available, using fallback)', undefined);
    logger.error('Vector store init error', err);
  }
}

/**
 * Upserts a vector record into the store.
 * @param options - Upsert options
 */
export async function upsertVector(options: VectorUpsertOptions): Promise<void> {
  const { id, namespace, vector, metadata } = options;
  await query(
    `INSERT INTO vector_store (id, namespace, vector, metadata)
     VALUES ($1, $2, $3::vector, $4)
     ON CONFLICT (id, namespace) DO UPDATE
       SET vector = EXCLUDED.vector,
           metadata = EXCLUDED.metadata`,
    [id, namespace, JSON.stringify(vector), JSON.stringify(metadata ?? {})],
  );
}

/**
 * Performs a cosine similarity search.
 * @param namespace - Namespace to search within
 * @param queryVector - Query embedding vector
 * @param topK - Number of results to return
 * @param threshold - Minimum similarity threshold (0-1)
 * @returns Ranked search results
 */
export async function searchSimilar(
  namespace: string,
  queryVector: number[],
  topK = 10,
  threshold = 0.7,
): Promise<VectorSearchResult[]> {
  try {
    const result = await query<{
      id: string;
      namespace: string;
      metadata: Record<string, unknown>;
      similarity: number;
      created_at: Date;
    }>(
      `SELECT id, namespace, metadata,
              1 - (vector <=> $1::vector) AS similarity,
              created_at
       FROM vector_store
       WHERE namespace = $2
         AND 1 - (vector <=> $1::vector) >= $3
       ORDER BY vector <=> $1::vector
       LIMIT $4`,
      [JSON.stringify(queryVector), namespace, threshold, topK],
    );

    return result.rows.map((row) => ({
      id: row.id,
      namespace: row.namespace,
      metadata: row.metadata,
      similarity: row.similarity,
      createdAt: row.created_at,
    }));
  } catch (err) {
    logger.error('Vector search failed', err);
    return [];
  }
}

/**
 * Deletes a vector record by ID and namespace.
 * @param id - Record ID
 * @param namespace - Record namespace
 */
export async function deleteVector(id: string, namespace: string): Promise<void> {
  await query('DELETE FROM vector_store WHERE id = $1 AND namespace = $2', [id, namespace]);
}

/**
 * Deletes all vectors in a namespace.
 * @param namespace - Namespace to clear
 * @returns Number of deleted records
 */
export async function clearNamespace(namespace: string): Promise<number> {
  const result = await query('DELETE FROM vector_store WHERE namespace = $1', [namespace]);
  return result.rowCount ?? 0;
}

/**
 * Batch upserts multiple vectors in a single transaction.
 * @param records - Array of vector upsert options
 */
export async function batchUpsertVectors(records: VectorUpsertOptions[]): Promise<void> {
  await withTransaction(async (client) => {
    for (const record of records) {
      await client.query(
        `INSERT INTO vector_store (id, namespace, vector, metadata)
         VALUES ($1, $2, $3::vector, $4)
         ON CONFLICT (id, namespace) DO UPDATE
           SET vector = EXCLUDED.vector, metadata = EXCLUDED.metadata`,
        [record.id, record.namespace, JSON.stringify(record.vector), JSON.stringify(record.metadata ?? {})],
      );
    }
  });
}

export default { initializeVectorStore, upsertVector, searchSimilar, deleteVector, clearNamespace, batchUpsertVectors };
