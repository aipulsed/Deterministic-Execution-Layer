/**
 * @file jsonToCsv.ts
 * @description Converts JSON array to CSV string.
 */
import { stringify } from 'csv-stringify/sync';
export function jsonToCsv(data: Record<string, unknown>[], options: { header?: boolean; delimiter?: string } = {}): string {
  return stringify(data, { header: options.header !== false, delimiter: options.delimiter ?? ',' });
}
export default { jsonToCsv };
