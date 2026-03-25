/**
 * @file dependencyScheduler.ts
 * @description Dependency-aware task scheduler that executes tasks in topological
 *              order, respecting inter-task dependencies in the DEL.
 */

import { logger } from '../logger/logger';
import { v4 as uuidv4 } from 'uuid';

/** Dependency task definition */
export interface DependencyTask {
  id: string;
  name: string;
  dependencies: string[];
  handler: (context: Record<string, unknown>) => Promise<unknown>;
  timeout?: number;
  retries?: number;
}

/** Task execution result */
export interface TaskExecutionResult {
  taskId: string;
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  result?: unknown;
  error?: string;
  durationMs: number;
}

/** Pipeline execution result */
export interface PipelineResult {
  success: boolean;
  tasks: TaskExecutionResult[];
  context: Record<string, unknown>;
  totalDurationMs: number;
}

/**
 * Resolves the execution order of tasks using topological sort (Kahn's algorithm).
 * @param tasks - Map of task definitions
 * @returns Ordered array of task IDs
 * @throws Error if a dependency cycle is detected
 */
export function topologicalSort(tasks: Map<string, DependencyTask>): string[] {
  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  for (const [id] of tasks) {
    inDegree.set(id, 0);
    adjList.set(id, []);
  }

  for (const [id, task] of tasks) {
    for (const dep of task.dependencies) {
      if (!tasks.has(dep)) throw new Error(`Task '${id}' depends on unknown task '${dep}'`);
      adjList.get(dep)!.push(id);
      inDegree.set(id, (inDegree.get(id) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id);
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    sorted.push(id);
    for (const neighbor of adjList.get(id) ?? []) {
      const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) queue.push(neighbor);
    }
  }

  if (sorted.length !== tasks.size) {
    throw new Error('Dependency cycle detected in task graph');
  }

  return sorted;
}

/**
 * Executes a set of dependency-ordered tasks.
 * @param tasks - Array of task definitions
 * @param initialContext - Initial shared context
 * @returns Pipeline execution result
 */
export async function executeDependencyPipeline(
  tasks: DependencyTask[],
  initialContext: Record<string, unknown> = {},
): Promise<PipelineResult> {
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const order = topologicalSort(taskMap);
  const context = { ...initialContext };
  const results: TaskExecutionResult[] = [];
  const failed = new Set<string>();
  const startTime = Date.now();

  for (const taskId of order) {
    const task = taskMap.get(taskId)!;
    const shouldSkip = task.dependencies.some((dep) => failed.has(dep));

    if (shouldSkip) {
      results.push({ taskId, name: task.name, status: 'skipped', durationMs: 0 });
      failed.add(taskId);
      continue;
    }

    const taskStart = Date.now();
    let attempts = 0;
    const maxAttempts = (task.retries ?? 0) + 1;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const result = await Promise.race([
          task.handler(context),
          task.timeout
            ? new Promise((_, reject) => setTimeout(() => reject(new Error('Task timeout')), task.timeout))
            : Promise.resolve(undefined),
        ]);
        context[taskId] = result;
        results.push({
          taskId,
          name: task.name,
          status: 'completed',
          result,
          durationMs: Date.now() - taskStart,
        });
        break;
      } catch (err) {
        if (attempts >= maxAttempts) {
          const error = err instanceof Error ? err.message : String(err);
          results.push({ taskId, name: task.name, status: 'failed', error, durationMs: Date.now() - taskStart });
          failed.add(taskId);
          logger.error(`Dependency task failed: ${task.name}`, err);
        }
      }
    }
  }

  const success = failed.size === 0;
  return { success, tasks: results, context, totalDurationMs: Date.now() - startTime };
}

export default { topologicalSort, executeDependencyPipeline };
