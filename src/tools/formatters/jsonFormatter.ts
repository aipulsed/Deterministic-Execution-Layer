/**
 * @file jsonFormatter.ts
 * @description JSON formatter with sorting and indentation options
 */

export function formatJson(data: unknown, options: { indent?: number; sortKeys?: boolean } = {}): string {
  const { indent = 2, sortKeys = false } = options;
  if (sortKeys && typeof data === "object" && data !== null && !Array.isArray(data)) {
    const sorted = Object.fromEntries(Object.entries(data as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
    return JSON.stringify(sorted, null, indent);
  }
  return JSON.stringify(data, null, indent);
}
export function parseAndFormat(jsonString: string, options?: { indent?: number; sortKeys?: boolean }): string {
  const parsed = JSON.parse(jsonString);
  return formatJson(parsed, options);
}
export default { formatJson, parseAndFormat };
