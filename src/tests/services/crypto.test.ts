/**
 * @file crypto.test.ts
 * @description Unit tests for crypto services.
 */
import { describe, it, expect } from 'vitest';
import { sha256, sha512, md5, hmacSha256, verifyHmac, randomHex } from '../../services/crypto/hashUtils';
import { encrypt, decrypt, encryptString, decryptString } from '../../services/crypto/encryptDecrypt';

const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('Crypto Services', () => {
  describe('hashUtils', () => {
    it('computes consistent SHA-256 hash', () => {
      expect(sha256('hello')).toBe(sha256('hello'));
      expect(sha256('hello')).not.toBe(sha256('world'));
      expect(sha256('hello')).toHaveLength(64);
    });

    it('computes SHA-512 hash of correct length', () => {
      expect(sha512('test')).toHaveLength(128);
    });

    it('computes MD5 hash', () => {
      expect(md5('hello')).toHaveLength(32);
    });

    it('generates random hex of correct length', () => {
      expect(randomHex(16)).toHaveLength(32);
      expect(randomHex(32)).toHaveLength(64);
    });

    it('verifies HMAC correctly', () => {
      const sig = hmacSha256('data', 'secret');
      expect(verifyHmac('data', 'secret', sig)).toBe(true);
      expect(verifyHmac('data', 'wrong-secret', sig)).toBe(false);
    });
  });

  describe('encryptDecrypt', () => {
    it('encrypts and decrypts a string', () => {
      const plaintext = 'Hello, World!';
      const envelope = encrypt(plaintext, TEST_KEY);
      const decrypted = decrypt(envelope, TEST_KEY);
      expect(decrypted.toString('utf-8')).toBe(plaintext);
    });

    it('encryptString and decryptString roundtrip', () => {
      const original = 'Secret message 🔒';
      const encrypted = encryptString(original, TEST_KEY);
      const decrypted = decryptString(encrypted, TEST_KEY);
      expect(decrypted).toBe(original);
    });

    it('throws on tampered ciphertext', () => {
      const envelope = encrypt('test', TEST_KEY);
      envelope.authTag = '0'.repeat(32);
      expect(() => decrypt(envelope, TEST_KEY)).toThrow();
    });

    it('throws on wrong key length', () => {
      expect(() => encrypt('test', 'tooshort')).toThrow();
    });
  });
});
