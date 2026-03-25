/**
 * @file index.ts
 * @description Main entry point for the Deterministic Execution Layer (DEL).
 *              Exports all pipelines, services, and tools.
 */

// Services
export * as logger from './services/logger/logger';
export * as errorHandler from './services/logger/errorHandler';
export * as auditLogger from './services/logger/auditLogger';
export * as eventLogger from './services/logger/eventLogger';
export * as postgresService from './services/database/postgresService';
export * as vectorStore from './services/database/vectorStore';
export * as migrations from './services/database/migrations';
export * as eventQueue from './services/queue/eventQueue';
export * as taskQueue from './services/queue/taskQueue';
export * as retryQueue from './services/queue/retryQueue';
export * as deadLetterQueue from './services/queue/deadLetterQueue';
export * as s3Storage from './services/storage/s3Storage';
export * as localStorage from './services/storage/localStorage';
export * as sendEmail from './services/email/sendEmail';
export * as emailTemplates from './services/email/emailTemplates';
export * as jobScheduler from './services/scheduler/jobScheduler';
export * as hashUtils from './services/crypto/hashUtils';
export * as encryptDecrypt from './services/crypto/encryptDecrypt';
export * as tokenSigner from './services/crypto/tokenSigner';

// Pipelines
export * as codingPipeline from './pipelines/coding/createProject';
export * as billingPipeline from './pipelines/billing/generateInvoice';
export * as crmPipeline from './pipelines/crm/createCustomer';

// Tools
export * as schemaValidator from './tools/validators/schemaValidator';
export * as fileValidator from './tools/validators/fileValidator';
export * as jsonFormatter from './tools/formatters/jsonFormatter';
export * as csvToJson from './tools/converters/csvToJson';
export * as jsonToCsv from './tools/converters/jsonToCsv';
export * as stringUtils from './tools/utils/stringUtils';
export * as dateUtils from './tools/utils/dateUtils';
export * as fileUtils from './tools/utils/fileUtils';
export * as helper from './tools/utils/helper';

// Helpers
export * as templateHelpers from './helpers/templateHelpers';
export * as errorHelpers from './helpers/errorHelpers';
export * as validationHelpers from './helpers/validationHelpers';
export * as apiHelpers from './helpers/apiHelpers';

export const VERSION = '1.0.0';
