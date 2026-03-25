/**
 * @file validateDocument.ts
 * @description Documents pipeline step: validateDocument
 */

import * as fs from "fs";
import * as path from "path";
export interface DocumentValidationResult { valid: boolean; errors: string[]; warnings: string[]; }
export async function validateDocument(filePath: string, options: { maxSizeBytes?: number; allowedFormats?: string[] } = {}): Promise<DocumentValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!fs.existsSync(filePath)) { errors.push("File does not exist"); return { valid: false, errors, warnings }; }
  const stat = fs.statSync(filePath);
  if (options.maxSizeBytes && stat.size > options.maxSizeBytes) errors.push(`File size ${stat.size} exceeds maximum ${options.maxSizeBytes}`);
  const ext = path.extname(filePath).toLowerCase();
  if (options.allowedFormats && !options.allowedFormats.includes(ext)) errors.push(`Format ${ext} not allowed`);
  if (stat.size === 0) warnings.push("File is empty");
  return { valid: errors.length === 0, errors, warnings };
}
export default { validateDocument };
