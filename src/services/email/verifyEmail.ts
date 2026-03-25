/**
 * @file verifyEmail.ts
 * @description Email verification service that generates and validates
 *              verification tokens for user email confirmation workflows.
 */

import * as crypto from 'crypto';
import { logger } from '../logger/logger';
import { sendEmail } from './sendEmail';
import { renderTemplate } from './emailTemplates';

/** Verification token record */
export interface VerificationToken {
  token: string;
  email: string;
  type: 'email_verification' | 'password_reset' | 'email_change';
  expiresAt: Date;
  usedAt?: Date;
  createdAt: Date;
}

/** Token store (replace with DB in production) */
const tokenStore = new Map<string, VerificationToken>();

/**
 * Generates a cryptographically secure verification token.
 * @param email - Email address to verify
 * @param type - Token type
 * @param ttlHours - Token lifetime in hours
 * @returns Verification token record
 */
export function generateVerificationToken(
  email: string,
  type: VerificationToken['type'] = 'email_verification',
  ttlHours = 24,
): VerificationToken {
  const token = crypto.randomBytes(32).toString('hex');
  const record: VerificationToken = {
    token,
    email,
    type,
    expiresAt: new Date(Date.now() + ttlHours * 60 * 60 * 1000),
    createdAt: new Date(),
  };

  tokenStore.set(token, record);
  logger.debug('Verification token generated', undefined, { email, type });
  return record;
}

/**
 * Validates a verification token.
 * @param token - Token to validate
 * @param expectedType - Expected token type
 * @returns Email address if valid, null otherwise
 */
export function validateVerificationToken(
  token: string,
  expectedType?: VerificationToken['type'],
): string | null {
  const record = tokenStore.get(token);
  if (!record) {
    logger.warn('Verification token not found');
    return null;
  }
  if (record.usedAt) {
    logger.warn('Verification token already used', undefined, { email: record.email });
    return null;
  }
  if (new Date() > record.expiresAt) {
    logger.warn('Verification token expired', undefined, { email: record.email });
    return null;
  }
  if (expectedType && record.type !== expectedType) {
    logger.warn('Verification token type mismatch');
    return null;
  }

  record.usedAt = new Date();
  logger.info('Verification token validated', undefined, { email: record.email });
  return record.email;
}

/**
 * Sends a verification email to the given address.
 * @param email - Recipient email
 * @param verifyUrl - Base URL for verification link
 * @param appName - Application name
 * @returns The generated token
 */
export async function sendVerificationEmail(
  email: string,
  verifyUrl: string,
  appName = 'DEL',
): Promise<string> {
  const record = generateVerificationToken(email, 'email_verification');
  const link = `${verifyUrl}?token=${record.token}`;

  try {
    await sendEmail({
      to: email,
      subject: `Verify your email for ${appName}`,
      html: `<h1>Email Verification</h1><p>Click <a href="${link}">here</a> to verify your email. Link expires in 24 hours.</p>`,
      text: `Verify your email: ${link}`,
    });
    logger.info('Verification email sent', undefined, { email });
  } catch (err) {
    logger.error('Failed to send verification email', err);
    throw err;
  }

  return record.token;
}

/**
 * Revokes all tokens for a given email address.
 * @param email - Email address
 * @returns Number of revoked tokens
 */
export function revokeTokensForEmail(email: string): number {
  let count = 0;
  for (const [token, record] of tokenStore) {
    if (record.email === email && !record.usedAt) {
      record.usedAt = new Date();
      count++;
    }
  }
  return count;
}

export default { generateVerificationToken, validateVerificationToken, sendVerificationEmail, revokeTokensForEmail };
