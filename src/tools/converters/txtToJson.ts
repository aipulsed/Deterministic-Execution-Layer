/**
 * @file txtToJson.ts
 * @description Converts plain text to structured JSON.
 */
export function txtToJson(text: string, options: { splitBy?: string; trim?: boolean } = {}): string[] {
  const lines = text.split(options.splitBy ?? '\n');
  return options.trim !== false ? lines.map((l) => l.trim()).filter(Boolean) : lines;
}
export default { txtToJson };
