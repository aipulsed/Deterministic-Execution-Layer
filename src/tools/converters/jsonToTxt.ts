/**
 * @file jsonToTxt.ts
 * @description Converts JSON data to plain text.
 */
export function jsonToTxt(data: unknown, separator = '\n'): string {
  if (Array.isArray(data)) return data.map((item) => (typeof item === 'object' ? JSON.stringify(item) : String(item))).join(separator);
  if (typeof data === 'object' && data !== null) return Object.entries(data as Record<string, unknown>).map(([k, v]) => `${k}: ${v}`).join(separator);
  return String(data);
}
export default { jsonToTxt };
