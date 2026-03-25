/**
 * @file rustCompiler.ts
 * @description Compiler wrapper for rustCompiler
 */

import { execSync } from "child_process";
export interface RustCompileResult { success: boolean; output?: string; errors?: string[]; }
export function compileRust(srcPath: string, outputName: string, release = false): RustCompileResult {
  const releaseFlag = release ? "--release" : "";
  try {
    execSync(`rustc ${releaseFlag} "${srcPath}" -o "${outputName}"`, { encoding: "utf-8" });
    return { success: true };
  } catch (err: unknown) {
    const out = (err as { stderr?: string }).stderr ?? "";
    return { success: false, errors: out.split("\n").filter(Boolean) };
  }
}
export function cargoRun(crateDir: string, release = false): RustCompileResult {
  const releaseFlag = release ? "--release" : "";
  try {
    const output = execSync(`cargo run ${releaseFlag}`, { cwd: crateDir, encoding: "utf-8" });
    return { success: true, output };
  } catch (err: unknown) {
    const out = (err as { stderr?: string }).stderr ?? "";
    return { success: false, errors: out.split("\n").filter(Boolean) };
  }
}
export default { compileRust, cargoRun };
