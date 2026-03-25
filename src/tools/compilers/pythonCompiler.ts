/**
 * @file pythonCompiler.ts
 * @description Compiler wrapper for pythonCompiler
 */

import { execSync } from "child_process";
export interface PythonRunResult { success: boolean; stdout?: string; stderr?: string; }
export function runPython(script: string): PythonRunResult {
  try {
    const stdout = execSync(`python3 "${script}"`, { encoding: "utf-8" });
    return { success: true, stdout };
  } catch (err: unknown) {
    return { success: false, stderr: (err as { stderr?: string }).stderr ?? "" };
  }
}
export function compilePyc(script: string): PythonRunResult {
  try {
    execSync(`python3 -m py_compile "${script}"`, { encoding: "utf-8" });
    return { success: true };
  } catch (err: unknown) {
    return { success: false, stderr: (err as { stderr?: string }).stderr ?? "" };
  }
}
export default { runPython, compilePyc };
