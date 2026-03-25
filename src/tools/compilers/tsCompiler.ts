/**
 * @file tsCompiler.ts
 * @description Compiler wrapper for tsCompiler
 */

import { execSync } from "child_process";
export interface CompileResult { success: boolean; output?: string; errors?: string[]; }
export function compileTypeScript(tsConfigPath = "tsconfig.json"): CompileResult {
  try {
    execSync(`npx tsc --project "${tsConfigPath}"`, { encoding: "utf-8" });
    return { success: true };
  } catch (err: unknown) {
    const out = (err as { stdout?: string }).stdout ?? "";
    return { success: false, errors: out.split("\n").filter(Boolean) };
  }
}
export function compileTypeScriptFile(filePath: string, outDir = "dist"): CompileResult {
  try {
    execSync(`npx tsc "${filePath}" --outDir "${outDir}" --esModuleInterop --skipLibCheck`, { encoding: "utf-8" });
    return { success: true };
  } catch (err: unknown) {
    const out = (err as { stdout?: string }).stdout ?? "";
    return { success: false, errors: out.split("\n").filter(Boolean) };
  }
}
export default { compileTypeScript, compileTypeScriptFile };
