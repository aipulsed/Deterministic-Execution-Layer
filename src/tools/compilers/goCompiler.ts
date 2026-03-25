/**
 * @file goCompiler.ts
 * @description Compiler wrapper for goCompiler
 */

import { execSync } from "child_process";
export interface GoCompileResult { success: boolean; output?: string; errors?: string[]; }
export function buildGo(srcDir: string, outputName: string): GoCompileResult {
  try {
    execSync(`go build -o "${outputName}" "${srcDir}"`, { encoding: "utf-8" });
    return { success: true };
  } catch (err: unknown) {
    const out = (err as { stderr?: string }).stderr ?? "";
    return { success: false, errors: out.split("\n").filter(Boolean) };
  }
}
export function runGo(srcFile: string): GoCompileResult {
  try {
    const output = execSync(`go run "${srcFile}"`, { encoding: "utf-8" });
    return { success: true, output };
  } catch (err: unknown) {
    const out = (err as { stderr?: string }).stderr ?? "";
    return { success: false, errors: out.split("\n").filter(Boolean) };
  }
}
export default { buildGo, runGo };
