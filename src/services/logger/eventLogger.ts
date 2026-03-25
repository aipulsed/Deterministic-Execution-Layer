/**
 * @file eventLogger.ts
 * @description Event-based logging for system events, lifecycle hooks, and observable workflows
 *              in the Deterministic Execution Layer.
 */

import { EventEmitter } from 'events';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

/** System event types */
export type SystemEventType =
  | 'pipeline.started'
  | 'pipeline.completed'
  | 'pipeline.failed'
  | 'task.started'
  | 'task.completed'
  | 'task.failed'
  | 'task.retrying'
  | 'queue.message.enqueued'
  | 'queue.message.processed'
  | 'queue.message.dead'
  | 'storage.upload.started'
  | 'storage.upload.completed'
  | 'storage.upload.failed'
  | 'email.sent'
  | 'email.failed'
  | 'scheduler.job.started'
  | 'scheduler.job.completed'
  | 'scheduler.job.failed'
  | 'system.startup'
  | 'system.shutdown';

/** System event payload */
export interface SystemEvent {
  eventId: string;
  type: SystemEventType;
  timestamp: string;
  source: string;
  payload?: Record<string, unknown>;
  correlationId?: string;
  duration?: number;
  error?: string;
}

/** Event listener callback */
export type EventListener = (event: SystemEvent) => void | Promise<void>;

class EventLoggerService extends EventEmitter {
  private eventHistory: SystemEvent[] = [];
  private readonly maxHistorySize: number;

  constructor(maxHistorySize = 1000) {
    super();
    this.maxHistorySize = maxHistorySize;
    this.setMaxListeners(50);
  }

  /**
   * Emits and logs a system event.
   * @param type - Event type
   * @param source - Source component
   * @param payload - Event payload
   * @param correlationId - Optional correlation ID for tracing
   * @returns The emitted event
   */
  logEvent(
    type: SystemEventType,
    source: string,
    payload?: Record<string, unknown>,
    correlationId?: string,
  ): SystemEvent {
    const event: SystemEvent = {
      eventId: uuidv4(),
      type,
      timestamp: new Date().toISOString(),
      source,
      payload,
      correlationId,
    };

    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    logger.info(`Event: ${type}`, { service: source }, { eventId: event.eventId, correlationId });
    this.emit(type, event);
    this.emit('*', event);

    return event;
  }

  /**
   * Logs a pipeline start event.
   * @param pipelineId - Pipeline identifier
   * @param pipelineName - Pipeline name
   * @param correlationId - Correlation ID
   */
  pipelineStarted(pipelineId: string, pipelineName: string, correlationId?: string): SystemEvent {
    return this.logEvent('pipeline.started', 'pipeline', { pipelineId, pipelineName }, correlationId);
  }

  /**
   * Logs a pipeline completion event with duration.
   * @param pipelineId - Pipeline identifier
   * @param duration - Duration in milliseconds
   * @param correlationId - Correlation ID
   */
  pipelineCompleted(pipelineId: string, duration: number, correlationId?: string): SystemEvent {
    const event = this.logEvent('pipeline.completed', 'pipeline', { pipelineId, duration }, correlationId);
    event.duration = duration;
    return event;
  }

  /**
   * Logs a pipeline failure event.
   * @param pipelineId - Pipeline identifier
   * @param error - Error message
   * @param correlationId - Correlation ID
   */
  pipelineFailed(pipelineId: string, error: string, correlationId?: string): SystemEvent {
    const event = this.logEvent('pipeline.failed', 'pipeline', { pipelineId }, correlationId);
    event.error = error;
    return event;
  }

  /**
   * Subscribes to a specific event type.
   * @param type - Event type to listen to, or '*' for all events
   * @param listener - Callback function
   */
  subscribe(type: SystemEventType | '*', listener: EventListener): void {
    this.on(type, listener as (event: SystemEvent) => void);
  }

  /**
   * Unsubscribes from an event type.
   * @param type - Event type
   * @param listener - Callback to remove
   */
  unsubscribe(type: SystemEventType | '*', listener: EventListener): void {
    this.off(type, listener as (event: SystemEvent) => void);
  }

  /**
   * Returns the recent event history.
   * @param limit - Max events to return
   * @returns Recent events
   */
  getEventHistory(limit = 100): SystemEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Filters event history by type.
   * @param type - Event type filter
   * @returns Matching events
   */
  getEventsByType(type: SystemEventType): SystemEvent[] {
    return this.eventHistory.filter((e) => e.type === type);
  }
}

export const eventLogger = new EventLoggerService();
export default eventLogger;
