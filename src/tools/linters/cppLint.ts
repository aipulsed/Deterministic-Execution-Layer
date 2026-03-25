/**
 * @file cppLint.ts
 * @description C++ linting via cppcheck using child_process
 */

import { execSync } from "child_process";
export interface CppLintResult { file: string; issues: CppIssue[]; }
export interface CppIssue { line: number; severity: string; id: string; message: string; }
export function lintCpp(file: string): CppLintResult {
  const issues: CppIssue[] = [];
  try {
    const output = execSync(`cppcheck --template="{file}:{line}:{severity}:{id}:{message}" "${file}" 2>&1`, { encoding: "utf-8" });
    for (const line of output.split("\n").filter(Boolean)) {
      const parts = line.split(":");
      if (parts.length >= 5) issues.push({ line: parseInt(parts[1]) || 0, severity: parts[2], id: parts[3], message: parts.slice(4).join(":").trim() });
    }
  } catch { }
  return { file, issues };
}
export default { lintCpp };
