/**
 * @file fileUtils.ts
 * @description File system utilities for reading, writing, and manipulating files.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Ensures a directory exists, creating it recursively if needed.
 * @param dirPath - Directory path
 */
export function ensureDir(dirPath: string): void {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Reads a file and returns its content as a string.
 * @param filePath - File path
 * @param encoding - Text encoding
 */
export function readTextFile(filePath: string, encoding: BufferEncoding = 'utf-8'): string {
  return fs.readFileSync(filePath, { encoding });
}

/**
 * Writes text to a file, creating parent directories as needed.
 * @param filePath - File path
 * @param content - Text content
 */
export function writeTextFile(filePath: string, content: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
}

/**
 * Reads a JSON file and parses it.
 * @param filePath - JSON file path
 */
export function readJsonFile<T = unknown>(filePath: string): T {
  return JSON.parse(readTextFile(filePath));
}

/**
 * Writes an object to a JSON file with formatting.
 * @param filePath - JSON file path
 * @param data - Data to write
 * @param indent - Indentation spaces
 */
export function writeJsonFile(filePath: string, data: unknown, indent = 2): void {
  writeTextFile(filePath, JSON.stringify(data, null, indent));
}

/**
 * Returns file extension in lowercase.
 * @param filePath - File path
 */
export function getExtension(filePath: string): string {
  return path.extname(filePath).toLowerCase();
}

/**
 * Computes the SHA-256 hash of a file's content.
 * @param filePath - File path
 * @returns Hex hash string
 */
export function fileHash(filePath: string): string {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Recursively lists all files in a directory.
 * @param dir - Directory path
 * @param ext - Optional file extension filter
 * @returns Array of absolute file paths
 */
export function listFilesRecursive(dir: string, ext?: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(full, ext));
    } else if (!ext || entry.name.endsWith(ext)) {
      results.push(full);
    }
  }
  return results;
}

/**
 * Copies a file to a destination, creating parent directories as needed.
 * @param src - Source path
 * @param dest - Destination path
 */
export function copyFile(src: string, dest: string): void {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

/**
 * Returns the size of a file in bytes.
 * @param filePath - File path
 */
export function fileSize(filePath: string): number {
  return fs.statSync(filePath).size;
}

export default { ensureDir, readTextFile, writeTextFile, readJsonFile, writeJsonFile, getExtension, fileHash, listFilesRecursive, copyFile, fileSize };
