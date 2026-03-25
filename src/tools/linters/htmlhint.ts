/**
 * @file htmlhint.ts
 * @description HTML hint and validation wrapper
 */

import { execSync } from "child_process";
export interface HtmlHintResult { file: string; messages: string[]; errorCount: number; }
export function hintHtml(files: string[]): HtmlHintResult[] {
  const results: HtmlHintResult[] = [];
  for (const file of files) {
    try {
      const output = execSync(`npx htmlhint "${file}"`, { encoding: "utf-8" });
      const errors = output.split("\n").filter((l) => l.includes("error") || l.includes("warning"));
      results.push({ file, messages: errors, errorCount: errors.length });
    } catch { results.push({ file, messages: ["HTMLHint not available"], errorCount: 0 }); }
  }
  return results;
}
export default { hintHtml };
