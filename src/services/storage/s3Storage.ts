/**
 * @file s3Storage.ts
 * @description AWS S3 storage service for file upload, download, and management
 *              in the Deterministic Execution Layer.
 */

import AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../logger/logger';

/** S3 storage configuration */
export interface S3Config {
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

/** Upload options */
export interface S3UploadOptions {
  key: string;
  body: Buffer | string | fs.ReadStream;
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: 'private' | 'public-read';
  expiresIn?: number;
}

/** S3 file metadata */
export interface S3FileMetadata {
  key: string;
  size: number;
  lastModified: Date;
  etag: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

let s3Client: AWS.S3 | null = null;
let s3Bucket = '';

/**
 * Initializes the S3 client.
 * @param config - S3 configuration
 */
export function initializeS3(config: S3Config): void {
  s3Client = new AWS.S3({
    accessKeyId: config.accessKeyId ?? process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.secretAccessKey ?? process.env.AWS_SECRET_ACCESS_KEY,
    region: config.region ?? process.env.AWS_REGION ?? 'us-east-1',
    endpoint: config.endpoint,
    s3ForcePathStyle: config.forcePathStyle,
  });
  s3Bucket = config.bucket;
  logger.info('S3 client initialized', undefined, { bucket: s3Bucket });
}

function getClient(): AWS.S3 {
  if (!s3Client) throw new Error('S3 client not initialized. Call initializeS3() first.');
  return s3Client;
}

/**
 * Uploads a file or buffer to S3.
 * @param options - Upload options
 * @returns Public URL or S3 URI
 */
export async function uploadFile(options: S3UploadOptions): Promise<string> {
  const client = getClient();
  const params: AWS.S3.PutObjectRequest = {
    Bucket: s3Bucket,
    Key: options.key,
    Body: options.body,
    ContentType: options.contentType ?? 'application/octet-stream',
    Metadata: options.metadata,
    ACL: options.acl ?? 'private',
  };

  try {
    const result = await client.upload(params).promise();
    logger.info('File uploaded to S3', undefined, { key: options.key, location: result.Location });
    return result.Location;
  } catch (err) {
    logger.error('S3 upload failed', err);
    throw err;
  }
}

/**
 * Downloads a file from S3.
 * @param key - Object key
 * @returns File buffer
 */
export async function downloadFile(key: string): Promise<Buffer> {
  const client = getClient();
  try {
    const result = await client.getObject({ Bucket: s3Bucket, Key: key }).promise();
    logger.info('File downloaded from S3', undefined, { key });
    return result.Body as Buffer;
  } catch (err) {
    logger.error('S3 download failed', err);
    throw err;
  }
}

/**
 * Generates a pre-signed URL for temporary access.
 * @param key - Object key
 * @param expiresIn - Expiry in seconds (default: 3600)
 * @returns Pre-signed URL
 */
export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const client = getClient();
  return client.getSignedUrlPromise('getObject', {
    Bucket: s3Bucket,
    Key: key,
    Expires: expiresIn,
  });
}

/**
 * Deletes a file from S3.
 * @param key - Object key
 */
export async function deleteFile(key: string): Promise<void> {
  const client = getClient();
  await client.deleteObject({ Bucket: s3Bucket, Key: key }).promise();
  logger.info('File deleted from S3', undefined, { key });
}

/**
 * Lists objects in the bucket with an optional prefix.
 * @param prefix - Key prefix filter
 * @param maxKeys - Maximum number of results
 * @returns Array of object metadata
 */
export async function listFiles(prefix = '', maxKeys = 1000): Promise<S3FileMetadata[]> {
  const client = getClient();
  const result = await client.listObjectsV2({ Bucket: s3Bucket, Prefix: prefix, MaxKeys: maxKeys }).promise();

  return (result.Contents ?? []).map((obj) => ({
    key: obj.Key!,
    size: obj.Size ?? 0,
    lastModified: obj.LastModified ?? new Date(),
    etag: (obj.ETag ?? '').replace(/"/g, ''),
  }));
}

/**
 * Checks whether a file exists in S3.
 * @param key - Object key
 * @returns True if exists
 */
export async function fileExists(key: string): Promise<boolean> {
  const client = getClient();
  try {
    await client.headObject({ Bucket: s3Bucket, Key: key }).promise();
    return true;
  } catch {
    return false;
  }
}

export default { initializeS3, uploadFile, downloadFile, getSignedUrl, deleteFile, listFiles, fileExists };
