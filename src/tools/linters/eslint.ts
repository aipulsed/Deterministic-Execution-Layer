/**
 * @file eslint.ts
 * @description ESLint programmatic API wrapper for JavaScript/TypeScript
 */

import { execSync } from "child_process";
export interface LintResult { filePath: string; errorCount: number; warningCount: number; messages: LintMessage[]; }
export interface LintMessage { line: number; column: number; severity: 1 | 2; message: string; ruleId?: string; }
export function lintFiles(patterns: string[], fix = false): LintResult[] {
  const fixFlag = fix ? "--fix" : "";
  try {
    const output = execSync(`npx eslint ${fixFlag} --format json ${patterns.join(" ")}`, { encoding: "utf-8" });
    return JSON.parse(output) as LintResult[];
  } catch (err: unknown) {
    const stderr = (err as { stdout?: string }).stdout ?? "";
    try { return JSON.parse(stderr) as LintResult[]; } catch { return []; }
  }
}
export default { lintFiles };
