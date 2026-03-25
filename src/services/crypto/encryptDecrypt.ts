/**
 * @file encryptDecrypt.ts
 * @description AES-256-GCM encryption and decryption utilities for the DEL.
 *              Provides authenticated encryption with associated data (AEAD).
 */

import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/** Encrypted data envelope */
export interface EncryptedEnvelope {
  iv: string;
  ciphertext: string;
  authTag: string;
  version: number;
}

/**
 * Derives a 32-byte key from a passphrase using PBKDF2.
 * @param passphrase - Passphrase string
 * @param salt - Salt buffer or string
 * @returns 32-byte key buffer
 */
export async function deriveKey(passphrase: string, salt: Buffer | string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      passphrase,
      salt,
      200000,
      KEY_LENGTH,
      'sha256',
      (err, key) => (err ? reject(err) : resolve(key)),
    );
  });
}

/**
 * Encrypts data using AES-256-GCM.
 * @param plaintext - Data to encrypt (string or Buffer)
 * @param key - 32-byte encryption key (hex or Buffer)
 * @returns Encrypted envelope
 */
export function encrypt(plaintext: string | Buffer, key: string | Buffer): EncryptedEnvelope {
  const keyBuf = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  if (keyBuf.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, keyBuf, iv, { authTagLength: AUTH_TAG_LENGTH });

  const data = typeof plaintext === 'string' ? Buffer.from(plaintext, 'utf-8') : plaintext;
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    ciphertext: encrypted.toString('hex'),
    authTag: authTag.toString('hex'),
    version: 1,
  };
}

/**
 * Decrypts an AES-256-GCM encrypted envelope.
 * @param envelope - Encrypted envelope
 * @param key - 32-byte decryption key (hex or Buffer)
 * @returns Decrypted buffer
 */
export function decrypt(envelope: EncryptedEnvelope, key: string | Buffer): Buffer {
  const keyBuf = typeof key === 'string' ? Buffer.from(key, 'hex') : key;
  if (keyBuf.length !== KEY_LENGTH) {
    throw new Error(`Decryption key must be ${KEY_LENGTH} bytes`);
  }

  const iv = Buffer.from(envelope.iv, 'hex');
  const ciphertext = Buffer.from(envelope.ciphertext, 'hex');
  const authTag = Buffer.from(envelope.authTag, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, keyBuf, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Encrypts a string and returns the envelope as a base64-encoded JSON string.
 * @param plaintext - String to encrypt
 * @param key - Encryption key
 * @returns Base64-encoded encrypted string
 */
export function encryptString(plaintext: string, key: string | Buffer): string {
  const envelope = encrypt(plaintext, key);
  return Buffer.from(JSON.stringify(envelope)).toString('base64');
}

/**
 * Decrypts a base64-encoded encrypted string.
 * @param encryptedBase64 - Base64-encoded encrypted string
 * @param key - Decryption key
 * @returns Decrypted plain text
 */
export function decryptString(encryptedBase64: string, key: string | Buffer): string {
  const envelope: EncryptedEnvelope = JSON.parse(Buffer.from(encryptedBase64, 'base64').toString('utf-8'));
  const decrypted = decrypt(envelope, key);
  return decrypted.toString('utf-8');
}

export default { deriveKey, encrypt, decrypt, encryptString, decryptString };
