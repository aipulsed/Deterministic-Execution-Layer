/**
 * @file templateHelpers.ts
 * @description Template rendering helpers for generating dynamic content in the DEL.
 */

import * as fs from 'fs';
import * as path from 'path';

/** Template cache */
const templateCache = new Map<string, string>();

/**
 * Loads a template from a file with caching.
 * @param templatePath - Absolute path to the template file
 * @returns Template string
 */
export function loadTemplate(templatePath: string): string {
  if (!templateCache.has(templatePath)) {
    templateCache.set(templatePath, fs.readFileSync(templatePath, 'utf-8'));
  }
  return templateCache.get(templatePath)!;
}

/**
 * Renders a template string with variable substitution.
 * Supports {{variable}}, {{variable|default}}, and {{#if variable}}...{{/if}} blocks.
 * @param template - Template string
 * @param variables - Variables map
 * @returns Rendered string
 */
export function renderTemplate(template: string, variables: Record<string, unknown>): string {
  let result = template;

  // Process {{#if variable}}...{{/if}} blocks
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    return variables[key] ? content : '';
  });

  // Process {{variable|default}} with default values
  result = result.replace(/\{\{(\w+)\|([^}]+)\}\}/g, (match, key, defaultVal) => {
    return variables[key] !== undefined ? String(variables[key]) : defaultVal;
  });

  // Process {{variable}} substitutions
  result = result.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] !== undefined ? String(variables[key]) : match;
  });

  return result;
}

/**
 * Renders a template from a file path.
 * @param templatePath - Path to template file
 * @param variables - Variables map
 * @returns Rendered string
 */
export function renderTemplateFile(templatePath: string, variables: Record<string, unknown>): string {
  const template = loadTemplate(templatePath);
  return renderTemplate(template, variables);
}

/**
 * Clears the template cache.
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

export default { loadTemplate, renderTemplate, renderTemplateFile, clearTemplateCache };
