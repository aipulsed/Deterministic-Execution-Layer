/**
 * @file logger.ts
 * @description Winston-based structured logger service with log levels, context support,
 *              and multiple transport configurations for the Deterministic Execution Layer.
 */

import winston from 'winston';
import loggingConfig from '../../configs/loggingConfig.json';

/** Log context metadata attached to log entries */
export interface LogContext {
  requestId?: string;
  userId?: string;
  traceId?: string;
  service?: string;
  [key: string]: unknown;
}

/** Log entry structure */
export interface LogEntry {
  level: string;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: string;
  stack?: string;
}

const { combine, timestamp, json, colorize, printf, errors } = winston.format;

const consoleFormat = printf(({ level, message, timestamp: ts, context, ...meta }) => {
  const ctx = context ? ` [${JSON.stringify(context)}]` : '';
  return `${ts} [${level.toUpperCase()}]${ctx}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
});

/**
 * Creates a Winston logger instance based on the logging configuration.
 * @returns Configured Winston logger
 */
function createLogger(): winston.Logger {
  const transports: winston.transport[] = [];

  for (const t of loggingConfig.transports) {
    if (t.type === 'console') {
      transports.push(
        new winston.transports.Console({
          level: t.level,
          format: combine(colorize(), timestamp(), consoleFormat),
        }),
      );
    } else if (t.type === 'file' && 'filename' in t) {
      transports.push(
        new winston.transports.File({
          level: t.level,
          filename: t.filename,
          maxsize: (t as { maxsize?: number }).maxsize,
          maxFiles: (t as { maxFiles?: number }).maxFiles,
          format: combine(timestamp(), errors({ stack: true }), json()),
        }),
      );
    }
  }

  return winston.createLogger({
    level: loggingConfig.level,
    format: combine(timestamp(), errors({ stack: true }), json()),
    transports,
    exitOnError: false,
  });
}

const winstonLogger = createLogger();

/**
 * Main application logger with structured logging support.
 */
export const logger = {
  /**
   * Log a debug message.
   * @param message - Log message
   * @param context - Optional context metadata
   * @param meta - Additional metadata
   */
  debug(message: string, context?: LogContext, meta?: Record<string, unknown>): void {
    winstonLogger.debug(message, { context, ...meta });
  },

  /**
   * Log an informational message.
   * @param message - Log message
   * @param context - Optional context metadata
   * @param meta - Additional metadata
   */
  info(message: string, context?: LogContext, meta?: Record<string, unknown>): void {
    winstonLogger.info(message, { context, ...meta });
  },

  /**
   * Log a warning message.
   * @param message - Log message
   * @param context - Optional context metadata
   * @param meta - Additional metadata
   */
  warn(message: string, context?: LogContext, meta?: Record<string, unknown>): void {
    winstonLogger.warn(message, { context, ...meta });
  },

  /**
   * Log an error message.
   * @param message - Log message
   * @param error - Optional Error object
   * @param context - Optional context metadata
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errMeta =
      error instanceof Error ? { error: error.message, stack: error.stack } : { error };
    winstonLogger.error(message, { context, ...errMeta });
  },

  /**
   * Create a child logger with pre-attached context.
   * @param context - Context to attach to all log entries
   * @returns Child logger instance
   */
  child(context: LogContext) {
    return {
      debug: (msg: string, meta?: Record<string, unknown>) =>
        winstonLogger.debug(msg, { context, ...meta }),
      info: (msg: string, meta?: Record<string, unknown>) =>
        winstonLogger.info(msg, { context, ...meta }),
      warn: (msg: string, meta?: Record<string, unknown>) =>
        winstonLogger.warn(msg, { context, ...meta }),
      error: (msg: string, err?: Error | unknown, meta?: Record<string, unknown>) => {
        const errMeta =
          err instanceof Error ? { error: err.message, stack: err.stack } : { error: err };
        winstonLogger.error(msg, { context, ...errMeta, ...meta });
      },
    };
  },

  /** Underlying Winston instance for advanced usage */
  _winston: winstonLogger,
};

export default logger;
