/**
 * @file csvToJson.ts
 * @description Converts CSV data to JSON array format.
 */
import { parse } from 'csv-parse/sync';
export function csvToJson(csv: string, options: { headers?: boolean; delimiter?: string } = {}): Record<string, string>[] {
  return parse(csv, { columns: options.headers !== false, skip_empty_lines: true, delimiter: options.delimiter ?? ',' }) as Record<string, string>[];
}
export default { csvToJson };
