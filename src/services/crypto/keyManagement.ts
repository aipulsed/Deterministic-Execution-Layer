/**
 * @file keyManagement.ts
 * @description Encryption key management for the DEL, providing key generation,
 *              rotation, storage, and retrieval with versioning support.
 */

import * as crypto from 'crypto';
import { logger } from '../logger/logger';

/** Key metadata */
export interface KeyRecord {
  id: string;
  version: number;
  algorithm: string;
  keyHex: string;
  createdAt: Date;
  expiresAt?: Date;
  active: boolean;
  purpose: string;
}

/** Key store (replace with HSM/KMS in production) */
const keyStore = new Map<string, KeyRecord[]>();

/**
 * Generates a new AES-256 encryption key.
 * @returns 32-byte key as hex string
 */
export function generateAES256Key(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generates an RSA key pair.
 * @param modulusLength - Key length in bits (default: 2048)
 * @returns Public/private key pair in PEM format
 */
export async function generateRSAKeyPair(modulusLength = 2048): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  return new Promise((resolve, reject) => {
    crypto.generateKeyPair(
      'rsa',
      {
        modulusLength,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      },
      (err, publicKey, privateKey) => {
        if (err) return reject(err);
        resolve({ publicKey, privateKey });
      },
    );
  });
}

/**
 * Stores a key under a named purpose with versioning.
 * @param purpose - Key purpose identifier
 * @param keyHex - Key as hex string
 * @param options - Key options
 * @returns Key record
 */
export function storeKey(
  purpose: string,
  keyHex: string,
  options: { algorithm?: string; expiresAt?: Date } = {},
): KeyRecord {
  const existing = keyStore.get(purpose) ?? [];
  existing.forEach((k) => (k.active = false));

  const record: KeyRecord = {
    id: crypto.randomUUID(),
    version: existing.length + 1,
    algorithm: options.algorithm ?? 'aes-256-gcm',
    keyHex,
    createdAt: new Date(),
    expiresAt: options.expiresAt,
    active: true,
    purpose,
  };

  existing.push(record);
  keyStore.set(purpose, existing);
  logger.info(`Key stored for purpose '${purpose}'`, undefined, { keyId: record.id, version: record.version });
  return record;
}

/**
 * Retrieves the active key for a purpose.
 * @param purpose - Key purpose identifier
 * @returns Active key record or null
 */
export function getActiveKey(purpose: string): KeyRecord | null {
  const keys = keyStore.get(purpose) ?? [];
  return keys.find((k) => k.active && (!k.expiresAt || k.expiresAt > new Date())) ?? null;
}

/**
 * Retrieves a specific key version.
 * @param purpose - Key purpose identifier
 * @param version - Key version number
 */
export function getKeyVersion(purpose: string, version: number): KeyRecord | null {
  const keys = keyStore.get(purpose) ?? [];
  return keys.find((k) => k.version === version) ?? null;
}

/**
 * Rotates the key for a purpose by generating and storing a new key.
 * @param purpose - Key purpose identifier
 * @returns New key record
 */
export function rotateKey(purpose: string): KeyRecord {
  const newKey = generateAES256Key();
  const record = storeKey(purpose, newKey);
  logger.info(`Key rotated for purpose '${purpose}'`, undefined, { version: record.version });
  return record;
}

/**
 * Lists all key versions for a purpose.
 * @param purpose - Key purpose
 */
export function listKeyVersions(purpose: string): Omit<KeyRecord, 'keyHex'>[] {
  return (keyStore.get(purpose) ?? []).map(({ keyHex: _k, ...rest }) => rest);
}

export default { generateAES256Key, generateRSAKeyPair, storeKey, getActiveKey, getKeyVersion, rotateKey, listKeyVersions };
