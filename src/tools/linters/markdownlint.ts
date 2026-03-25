/**
 * @file markdownlint.ts
 * @description Markdown linting for documentation quality
 */

import { execSync } from "child_process";
export interface MarkdownLintResult { file: string; issues: string[]; }
export function lintMarkdown(files: string[]): MarkdownLintResult[] {
  const results: MarkdownLintResult[] = [];
  for (const file of files) {
    try {
      execSync(`npx markdownlint "${file}"`, { encoding: "utf-8" });
      results.push({ file, issues: [] });
    } catch (err: unknown) {
      const output = (err as { stdout?: string; stderr?: string }).stderr ?? "";
      results.push({ file, issues: output.split("\n").filter(Boolean) });
    }
  }
  return results;
}
export default { lintMarkdown };
