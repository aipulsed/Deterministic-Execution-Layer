/**
 * @file stringUtils.ts
 * @description String manipulation utilities for the DEL.
 */

/**
 * Converts a string to camelCase.
 * @param str - Input string
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (c) => c.toLowerCase());
}

/**
 * Converts a string to PascalCase.
 * @param str - Input string
 */
export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Converts a string to snake_case.
 * @param str - Input string
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/[-\s]+/g, '_')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Converts a string to kebab-case.
 * @param str - Input string
 */
export function toKebabCase(str: string): string {
  return toSnakeCase(str).replace(/_/g, '-');
}

/**
 * Truncates a string to the specified length with an ellipsis.
 * @param str - Input string
 * @param maxLength - Maximum length including ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Escapes HTML special characters.
 * @param str - Input string
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Strips HTML tags from a string.
 * @param html - HTML string
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Generates a URL-safe slug from a string.
 * @param str - Input string
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Pads a string on the left to the specified length.
 * @param str - Input string
 * @param length - Target length
 * @param char - Pad character
 */
export function padLeft(str: string, length: number, char = ' '): string {
  return str.padStart(length, char);
}

/**
 * Counts occurrences of a substring.
 * @param str - Source string
 * @param sub - Substring to count
 */
export function countOccurrences(str: string, sub: string): number {
  if (!sub) return 0;
  let count = 0;
  let pos = 0;
  while ((pos = str.indexOf(sub, pos)) !== -1) { count++; pos += sub.length; }
  return count;
}

/**
 * Interpolates template placeholders like ${key} from a values map.
 * @param template - Template string
 * @param values - Values map
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\$\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}

export default { toCamelCase, toPascalCase, toSnakeCase, toKebabCase, truncate, escapeHtml, stripHtml, slugify, padLeft, countOccurrences, interpolate };
