/**
 * @file jsonlint.ts
 * @description JSON lint and validation
 */

export interface JsonLintResult { valid: boolean; errors: string[]; parsed?: unknown; }
export function lintJson(jsonString: string): JsonLintResult {
  try {
    const parsed = JSON.parse(jsonString);
    return { valid: true, errors: [], parsed };
  } catch (err) {
    return { valid: false, errors: [err instanceof Error ? err.message : String(err)] };
  }
}
export function lintJsonFile(filePath: string): JsonLintResult {
  const { readFileSync } = require("fs");
  try {
    const content = readFileSync(filePath, "utf-8") as string;
    return lintJson(content);
  } catch (err) {
    return { valid: false, errors: [err instanceof Error ? err.message : String(err)] };
  }
}
export default { lintJson, lintJsonFile };
