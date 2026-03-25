/**
 * @file lintCode.ts
 * @description Pipeline step: lintCode
 */

import { lintFiles } from "../../tools/linters/eslint";
export async function lintCode(patterns: string[], fix = false) {
  const results = lintFiles(patterns, fix);
  const totalErrors = results.reduce((s, r) => s + r.errorCount, 0);
  const totalWarnings = results.reduce((s, r) => s + r.warningCount, 0);
  return { success: totalErrors === 0, totalErrors, totalWarnings, results };
}
export default { lintCode };
