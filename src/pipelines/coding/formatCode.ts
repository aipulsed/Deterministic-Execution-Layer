/**
 * @file formatCode.ts
 * @description Pipeline step: formatCode
 */

import { formatFileWithPrettier } from "../../tools/formatters/prettier";
export async function formatCode(files: string[]) {
  const formatted: string[] = [];
  const errors: string[] = [];
  for (const f of files) {
    try { formatFileWithPrettier(f); formatted.push(f); }
    catch (err) { errors.push(`${f}: ${err instanceof Error ? err.message : err}`); }
  }
  return { success: errors.length === 0, formatted, errors };
}
export default { formatCode };
