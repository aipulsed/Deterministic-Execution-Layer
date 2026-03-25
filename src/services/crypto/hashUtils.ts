/**
 * @file hashUtils.ts
 * @description Hashing utilities including bcrypt for passwords and
 *              SHA-256/MD5 for data integrity in the DEL.
 */

import * as crypto from 'crypto';
import type { BinaryToTextEncoding } from 'crypto';
import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

/**
 * Hashes a password using bcrypt.
 * @param password - Plain text password
 * @param rounds - Salt rounds (default: 12)
 * @returns Bcrypt hash
 */
export async function hashPassword(password: string, rounds = BCRYPT_ROUNDS): Promise<string> {
  return bcrypt.hash(password, rounds);
}

/**
 * Verifies a password against a bcrypt hash.
 * @param password - Plain text password
 * @param hash - Bcrypt hash to compare
 * @returns True if password matches
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Computes a SHA-256 hash of the input data.
 * @param data - Input string or Buffer
 * @param encoding - Output encoding (default: 'hex')
 * @returns Hash string
 */
export function sha256(data: string | Buffer, encoding: BinaryToTextEncoding = 'hex'): string {
  return crypto.createHash('sha256').update(data).digest(encoding);
}

/**
 * Computes a SHA-512 hash of the input data.
 * @param data - Input string or Buffer
 * @param encoding - Output encoding
 * @returns Hash string
 */
export function sha512(data: string | Buffer, encoding: BinaryToTextEncoding = 'hex'): string {
  return crypto.createHash('sha512').update(data).digest(encoding);
}

/**
 * Computes an MD5 hash (use only for non-security purposes, e.g., checksums).
 * @param data - Input string or Buffer
 * @returns MD5 hex string
 */
export function md5(data: string | Buffer): string {
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Creates an HMAC-SHA256 signature.
 * @param data - Data to sign
 * @param secret - HMAC secret key
 * @returns Hex HMAC signature
 */
export function hmacSha256(data: string | Buffer, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verifies an HMAC-SHA256 signature using constant-time comparison.
 * @param data - Original data
 * @param secret - HMAC secret
 * @param expectedSignature - Expected hex signature
 * @returns True if valid
 */
export function verifyHmac(data: string | Buffer, secret: string, expectedSignature: string): boolean {
  const actual = hmacSha256(data, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Generates a random hex string.
 * @param bytes - Number of random bytes (default: 32)
 * @returns Random hex string
 */
export function randomHex(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generates a random base64url string suitable for tokens.
 * @param bytes - Number of random bytes
 * @returns Base64url-encoded random string
 */
export function randomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('base64url');
}

export default { hashPassword, verifyPassword, sha256, sha512, md5, hmacSha256, verifyHmac, randomHex, randomToken };
