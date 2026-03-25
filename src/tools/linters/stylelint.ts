/**
 * @file stylelint.ts
 * @description Stylelint wrapper for CSS/SCSS/Less linting
 */

import { execSync } from "child_process";
export interface StyleLintResult { source: string; warnings: StyleLintWarning[]; errored: boolean; }
export interface StyleLintWarning { line: number; column: number; severity: string; text: string; rule: string; }
export function lintStyles(patterns: string[], fix = false): StyleLintResult[] {
  const fixFlag = fix ? "--fix" : "";
  try {
    const output = execSync(`npx stylelint ${fixFlag} --formatter json ${patterns.join(" ")}`, { encoding: "utf-8" });
    const result = JSON.parse(output) as { results: StyleLintResult[] };
    return result.results;
  } catch { return []; }
}
export default { lintStyles };
