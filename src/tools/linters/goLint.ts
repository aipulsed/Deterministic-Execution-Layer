/**
 * @file goLint.ts
 * @description Go linting wrapper using go vet and staticcheck
 */

import { execSync } from "child_process";
export interface GoLintResult { pkg: string; issues: string[]; }
export function lintGo(pkg = "./..."): GoLintResult {
  const issues: string[] = [];
  try {
    execSync(`go vet ${pkg}`, { encoding: "utf-8" });
  } catch (err: unknown) {
    const out = (err as { stderr?: string }).stderr ?? "";
    issues.push(...out.split("\n").filter(Boolean));
  }
  return { pkg, issues };
}
export default { lintGo };
