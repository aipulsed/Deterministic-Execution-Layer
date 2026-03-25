/**
 * @file csvToXlsx.ts
 * @description Converts CSV data to XLSX format.
 */
import { parse } from 'csv-parse/sync';
export function csvToXlsxData(csv: string): Record<string, string>[] {
  return parse(csv, { columns: true, skip_empty_lines: true }) as Record<string, string>[];
}
export default { csvToXlsxData };
