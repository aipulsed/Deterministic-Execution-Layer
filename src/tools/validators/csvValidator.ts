/**
 * @file csvValidator.ts
 * @description CSV format and content validation for the DEL.
 */

import { parse } from 'csv-parse/sync';

export interface CsvValidationOptions {
  requiredHeaders?: string[];
  maxRows?: number;
  delimiter?: string;
}

export interface CsvValidationResult {
  valid: boolean;
  errors: string[];
  headers?: string[];
  rowCount?: number;
}

/**
 * Validates CSV string content and structure.
 * @param csvString - Raw CSV content
 * @param options - Validation options
 * @returns Validation result
 */
export function validateCsv(csvString: string, options: CsvValidationOptions = {}): CsvValidationResult {
  const errors: string[] = [];

  if (!csvString.trim()) {
    return { valid: false, errors: ['CSV content is empty'] };
  }

  let records: string[][];
  try {
    records = parse(csvString, {
      delimiter: options.delimiter ?? ',',
      skip_empty_lines: true,
      relax_quotes: true,
    }) as string[][];
  } catch (err) {
    return { valid: false, errors: [`CSV parse error: ${err instanceof Error ? err.message : err}`] };
  }

  if (records.length === 0) {
    return { valid: false, errors: ['CSV has no rows'] };
  }

  const headers = records[0];
  const dataRows = records.slice(1);

  if (options.requiredHeaders) {
    for (const h of options.requiredHeaders) {
      if (!headers.includes(h)) errors.push(`Missing required header: '${h}'`);
    }
  }

  if (options.maxRows !== undefined && dataRows.length > options.maxRows) {
    errors.push(`Row count ${dataRows.length} exceeds maximum ${options.maxRows}`);
  }

  for (let i = 0; i < dataRows.length; i++) {
    if (dataRows[i].length !== headers.length) {
      errors.push(`Row ${i + 2}: column count ${dataRows[i].length} does not match header count ${headers.length}`);
    }
  }

  return { valid: errors.length === 0, errors, headers, rowCount: dataRows.length };
}

export default { validateCsv };
