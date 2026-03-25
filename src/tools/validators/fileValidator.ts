/**
 * @file fileValidator.ts
 * @description File type and size validation for uploaded files in the DEL.
 */

import * as path from 'path';

/** File validation options */
export interface FileValidationOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  minSizeBytes?: number;
}

/** File validation result */
export interface FileValidationResult {
  valid: boolean;
  errors: string[];
}

/** MIME type to extension mapping */
const MIME_EXTENSIONS: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp'],
  'image/svg+xml': ['.svg'],
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'text/csv': ['.csv'],
  'application/json': ['.json'],
  'application/xml': ['.xml'],
  'text/xml': ['.xml'],
  'application/zip': ['.zip'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'video/mp4': ['.mp4'],
};

/**
 * Validates a file's size and type.
 * @param filename - Original filename
 * @param sizeBytes - File size in bytes
 * @param mimeType - MIME type
 * @param options - Validation options
 * @returns Validation result
 */
export function validateFile(
  filename: string,
  sizeBytes: number,
  mimeType: string,
  options: FileValidationOptions = {},
): FileValidationResult {
  const errors: string[] = [];
  const ext = path.extname(filename).toLowerCase();

  if (options.maxSizeBytes !== undefined && sizeBytes > options.maxSizeBytes) {
    errors.push(`File size ${sizeBytes} bytes exceeds maximum ${options.maxSizeBytes} bytes`);
  }

  if (options.minSizeBytes !== undefined && sizeBytes < options.minSizeBytes) {
    errors.push(`File size ${sizeBytes} bytes is below minimum ${options.minSizeBytes} bytes`);
  }

  if (options.allowedMimeTypes && !options.allowedMimeTypes.includes(mimeType)) {
    errors.push(`MIME type '${mimeType}' is not allowed`);
  }

  if (options.allowedExtensions && !options.allowedExtensions.includes(ext)) {
    errors.push(`File extension '${ext}' is not allowed`);
  }

  // Check MIME/extension consistency
  const expectedExts = MIME_EXTENSIONS[mimeType];
  if (expectedExts && !expectedExts.includes(ext)) {
    errors.push(`File extension '${ext}' does not match MIME type '${mimeType}'`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Returns common MIME types for a given extension.
 * @param ext - File extension (including dot)
 */
export function getMimeTypesForExtension(ext: string): string[] {
  const lower = ext.toLowerCase();
  return Object.entries(MIME_EXTENSIONS)
    .filter(([, exts]) => exts.includes(lower))
    .map(([mime]) => mime);
}

/**
 * Checks if a file is an image based on MIME type.
 * @param mimeType - MIME type
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

/**
 * Checks if a file is a document based on extension or MIME type.
 * @param filename - Filename
 */
export function isDocument(filename: string): boolean {
  const ext = path.extname(filename).toLowerCase();
  return ['.pdf', '.docx', '.doc', '.txt', '.xlsx', '.csv'].includes(ext);
}

export default { validateFile, getMimeTypesForExtension, isImage, isDocument };
