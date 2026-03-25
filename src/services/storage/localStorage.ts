/**
 * @file localStorage.ts
 * @description Local filesystem storage service for file management
 *              in development and single-server deployments of the DEL.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { logger } from '../logger/logger';

/** Local storage configuration */
export interface LocalStorageConfig {
  basePath: string;
  maxFileSizeBytes?: number;
  allowedExtensions?: string[];
}

/** File metadata */
export interface LocalFileMetadata {
  key: string;
  filename: string;
  size: number;
  mimeType?: string;
  hash: string;
  createdAt: Date;
  modifiedAt: Date;
  fullPath: string;
}

let storageConfig: LocalStorageConfig = { basePath: './uploads' };

/**
 * Initializes the local storage service.
 * @param config - Storage configuration
 */
export function initializeLocalStorage(config: LocalStorageConfig): void {
  storageConfig = config;
  if (!fs.existsSync(config.basePath)) {
    fs.mkdirSync(config.basePath, { recursive: true });
  }
  logger.info('Local storage initialized', undefined, { basePath: config.basePath });
}

/**
 * Resolves a storage key to an absolute file path.
 * @param key - Storage key (relative path)
 */
function resolvePath(key: string): string {
  const resolved = path.resolve(storageConfig.basePath, key);
  if (!resolved.startsWith(path.resolve(storageConfig.basePath))) {
    throw new Error('Path traversal detected');
  }
  return resolved;
}

/**
 * Saves a buffer or string to the local storage.
 * @param key - Storage key (relative path)
 * @param data - File data
 * @returns File metadata
 */
export async function saveFile(key: string, data: Buffer | string): Promise<LocalFileMetadata> {
  const fullPath = resolvePath(key);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const buffer = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data;

  if (storageConfig.maxFileSizeBytes && buffer.length > storageConfig.maxFileSizeBytes) {
    throw new Error(`File size ${buffer.length} exceeds maximum ${storageConfig.maxFileSizeBytes}`);
  }

  const ext = path.extname(key).toLowerCase();
  if (storageConfig.allowedExtensions && !storageConfig.allowedExtensions.includes(ext)) {
    throw new Error(`File extension '${ext}' is not allowed`);
  }

  fs.writeFileSync(fullPath, buffer);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const stat = fs.statSync(fullPath);

  logger.debug('File saved to local storage', undefined, { key, size: buffer.length });

  return {
    key,
    filename: path.basename(key),
    size: buffer.length,
    hash,
    createdAt: stat.birthtime,
    modifiedAt: stat.mtime,
    fullPath,
  };
}

/**
 * Reads a file from local storage.
 * @param key - Storage key
 * @returns File buffer
 */
export async function readFile(key: string): Promise<Buffer> {
  const fullPath = resolvePath(key);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${key}`);
  }
  return fs.readFileSync(fullPath);
}

/**
 * Deletes a file from local storage.
 * @param key - Storage key
 */
export async function deleteFile(key: string): Promise<void> {
  const fullPath = resolvePath(key);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    logger.debug('File deleted from local storage', undefined, { key });
  }
}

/**
 * Lists files in a directory.
 * @param prefix - Directory prefix
 * @returns Array of file metadata
 */
export async function listFiles(prefix = ''): Promise<LocalFileMetadata[]> {
  const dir = resolvePath(prefix || '.');
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const results: LocalFileMetadata[] = [];

  for (const entry of entries) {
    if (entry.isFile()) {
      const fullPath = path.join(dir, entry.name);
      const stat = fs.statSync(fullPath);
      const buffer = fs.readFileSync(fullPath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      results.push({
        key: path.join(prefix, entry.name),
        filename: entry.name,
        size: stat.size,
        hash,
        createdAt: stat.birthtime,
        modifiedAt: stat.mtime,
        fullPath,
      });
    }
  }

  return results;
}

/**
 * Checks if a file exists.
 * @param key - Storage key
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    return fs.existsSync(resolvePath(key));
  } catch {
    return false;
  }
}

export default { initializeLocalStorage, saveFile, readFile, deleteFile, listFiles, fileExists };
