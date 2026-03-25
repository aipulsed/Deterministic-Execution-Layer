/**
 * @file pythonLint.ts
 * @description Python linting via flake8/pylint using child_process
 */

import { execSync } from "child_process";
export interface PythonLintResult { file: string; issues: PythonLintIssue[]; }
export interface PythonLintIssue { line: number; col: number; code: string; message: string; }
export function lintPython(file: string): PythonLintResult {
  const issues: PythonLintIssue[] = [];
  try {
    const output = execSync(`python3 -m flake8 --format=default "${file}"`, { encoding: "utf-8" });
    for (const line of output.split("\n").filter(Boolean)) {
      const m = line.match(/^.+:(\d+):(\d+):\s+([A-Z]\d+)\s+(.+)$/);
      if (m) issues.push({ line: parseInt(m[1]), col: parseInt(m[2]), code: m[3], message: m[4] });
    }
  } catch (err: unknown) {
    const out = (err as { stdout?: string }).stdout ?? "";
    for (const line of out.split("\n").filter(Boolean)) {
      const m = line.match(/^.+:(\d+):(\d+):\s+([A-Z]\d+)\s+(.+)$/);
      if (m) issues.push({ line: parseInt(m[1]), col: parseInt(m[2]), code: m[3], message: m[4] });
    }
  }
  return { file, issues };
}
export default { lintPython };
