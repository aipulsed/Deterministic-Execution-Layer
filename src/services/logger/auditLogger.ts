/**
 * @file auditLogger.ts
 * @description Audit logging service for security and compliance events.
 *              Records user actions, data access, and system changes with immutable trail.
 */

import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

/** Categories of audit events */
export type AuditEventCategory =
  | 'authentication'
  | 'authorization'
  | 'data_access'
  | 'data_modification'
  | 'system_change'
  | 'user_management'
  | 'billing'
  | 'export'
  | 'import';

/** Severity level for audit events */
export type AuditSeverity = 'low' | 'medium' | 'high' | 'critical';

/** Audit event record */
export interface AuditEvent {
  auditId: string;
  timestamp: string;
  category: AuditEventCategory;
  action: string;
  actor: {
    userId?: string;
    username?: string;
    ipAddress?: string;
    userAgent?: string;
  };
  resource?: {
    type: string;
    id?: string;
    name?: string;
  };
  outcome: 'success' | 'failure' | 'attempt';
  severity: AuditSeverity;
  details?: Record<string, unknown>;
  correlationId?: string;
}

/** In-memory audit log store (replace with DB in production) */
const auditLog: AuditEvent[] = [];

/**
 * Records an audit event to the audit log and structured logger.
 * @param event - Partial audit event (auditId and timestamp auto-generated)
 * @returns The recorded audit event
 */
export async function recordAuditEvent(
  event: Omit<AuditEvent, 'auditId' | 'timestamp'>,
): Promise<AuditEvent> {
  const auditEvent: AuditEvent = {
    auditId: uuidv4(),
    timestamp: new Date().toISOString(),
    ...event,
  };

  auditLog.push(auditEvent);

  logger.info('AUDIT', undefined, {
    audit: true,
    auditId: auditEvent.auditId,
    category: auditEvent.category,
    action: auditEvent.action,
    actor: auditEvent.actor,
    resource: auditEvent.resource,
    outcome: auditEvent.outcome,
    severity: auditEvent.severity,
    details: auditEvent.details,
    correlationId: auditEvent.correlationId,
  });

  return auditEvent;
}

/**
 * Records a successful authentication event.
 * @param userId - User ID
 * @param username - Username
 * @param ipAddress - Client IP address
 */
export async function auditLogin(
  userId: string,
  username: string,
  ipAddress?: string,
): Promise<AuditEvent> {
  return recordAuditEvent({
    category: 'authentication',
    action: 'LOGIN',
    actor: { userId, username, ipAddress },
    outcome: 'success',
    severity: 'low',
  });
}

/**
 * Records a failed authentication event.
 * @param username - Attempted username
 * @param ipAddress - Client IP address
 * @param reason - Reason for failure
 */
export async function auditLoginFailure(
  username: string,
  ipAddress?: string,
  reason?: string,
): Promise<AuditEvent> {
  return recordAuditEvent({
    category: 'authentication',
    action: 'LOGIN_FAILED',
    actor: { username, ipAddress },
    outcome: 'failure',
    severity: 'medium',
    details: { reason },
  });
}

/**
 * Records a data modification event.
 * @param userId - User performing the action
 * @param resourceType - Type of resource modified
 * @param resourceId - ID of the resource
 * @param action - Action performed (CREATE, UPDATE, DELETE)
 * @param changes - What changed
 */
export async function auditDataModification(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  changes?: Record<string, unknown>,
): Promise<AuditEvent> {
  return recordAuditEvent({
    category: 'data_modification',
    action,
    actor: { userId },
    resource: { type: resourceType, id: resourceId },
    outcome: 'success',
    severity: action === 'DELETE' ? 'high' : 'medium',
    details: changes ? { changes } : undefined,
  });
}

/**
 * Queries audit events with optional filters.
 * @param filters - Filter criteria
 * @returns Matching audit events
 */
export async function queryAuditLog(filters: {
  userId?: string;
  category?: AuditEventCategory;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
  outcome?: 'success' | 'failure' | 'attempt';
  limit?: number;
}): Promise<AuditEvent[]> {
  let results = [...auditLog];

  if (filters.userId) {
    results = results.filter((e) => e.actor.userId === filters.userId);
  }
  if (filters.category) {
    results = results.filter((e) => e.category === filters.category);
  }
  if (filters.action) {
    results = results.filter((e) => e.action === filters.action);
  }
  if (filters.outcome) {
    results = results.filter((e) => e.outcome === filters.outcome);
  }
  if (filters.fromDate) {
    results = results.filter((e) => new Date(e.timestamp) >= filters.fromDate!);
  }
  if (filters.toDate) {
    results = results.filter((e) => new Date(e.timestamp) <= filters.toDate!);
  }

  const limit = filters.limit ?? 100;
  return results.slice(-limit);
}

export default { recordAuditEvent, auditLogin, auditLoginFailure, auditDataModification, queryAuditLog };
