/**
 * @file sendEmail.ts
 * @description Email sending service using Nodemailer with SMTP transport
 *              and retry support for the Deterministic Execution Layer.
 */

import nodemailer from 'nodemailer';
import { logger } from '../logger/logger';

/** Email transport configuration */
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth?: { user: string; pass: string };
  from: string;
  rejectUnauthorized?: boolean;
}

/** Email message options */
export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  headers?: Record<string, string>;
}

/** Email attachment */
export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
  encoding?: string;
  cid?: string;
}

/** Email send result */
export interface EmailResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  response: string;
}

let transporter: nodemailer.Transporter | null = null;
let defaultFrom = 'noreply@example.com';

/**
 * Initializes the email transporter.
 * @param config - SMTP configuration
 */
export function initializeEmailService(config: EmailConfig): void {
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    tls: { rejectUnauthorized: config.rejectUnauthorized ?? false },
  });
  defaultFrom = config.from;
  logger.info('Email service initialized', undefined, { host: config.host, port: config.port });
}

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    throw new Error('Email service not initialized. Call initializeEmailService() first.');
  }
  return transporter;
}

/**
 * Sends an email message.
 * @param message - Email message options
 * @returns Send result
 */
export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const t = getTransporter();
  const recipients = Array.isArray(message.to) ? message.to : [message.to];

  try {
    const info = await t.sendMail({
      from: defaultFrom,
      to: recipients.join(', '),
      cc: message.cc,
      bcc: message.bcc,
      subject: message.subject,
      text: message.text,
      html: message.html,
      attachments: message.attachments,
      replyTo: message.replyTo,
      headers: message.headers,
    });

    logger.info('Email sent', undefined, {
      messageId: info.messageId,
      to: recipients,
      subject: message.subject,
    });

    return {
      messageId: info.messageId,
      accepted: (info.accepted as string[]) ?? [],
      rejected: (info.rejected as string[]) ?? [],
      response: info.response ?? '',
    };
  } catch (err) {
    logger.error('Failed to send email', err);
    throw err;
  }
}

/**
 * Verifies the SMTP connection.
 * @returns True if connection is valid
 */
export async function verifyConnection(): Promise<boolean> {
  try {
    await getTransporter().verify();
    logger.info('SMTP connection verified');
    return true;
  } catch (err) {
    logger.error('SMTP connection verification failed', err);
    return false;
  }
}

/**
 * Sends an email with retry logic.
 * @param message - Email message
 * @param maxAttempts - Max send attempts
 * @returns Send result
 */
export async function sendEmailWithRetry(message: EmailMessage, maxAttempts = 3): Promise<EmailResult> {
  let lastError: Error | unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await sendEmail(message);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        logger.warn(`Email send attempt ${attempt} failed, retrying...`);
      }
    }
  }
  throw lastError;
}

export default { initializeEmailService, sendEmail, verifyConnection, sendEmailWithRetry };
