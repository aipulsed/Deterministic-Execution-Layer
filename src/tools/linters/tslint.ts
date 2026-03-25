/**
 * @file tslint.ts
 * @description TypeScript linting wrapper using TSC type-checking
 */

import { execSync } from "child_process";
export interface TsError { file: string; line: number; col: number; message: string; code: number; }
export function typecheckFiles(tsConfigPath = "tsconfig.json"): TsError[] {
  try {
    execSync(`npx tsc --noEmit --project ${tsConfigPath}`, { encoding: "utf-8" });
    return [];
  } catch (err: unknown) {
    const output = (err as { stdout?: string; stderr?: string }).stdout ?? (err as { stderr?: string }).stderr ?? "";
    const errors: TsError[] = [];
    const regex = /^(.+)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.+)$/gm;
    let m;
    while ((m = regex.exec(output)) !== null) {
      errors.push({ file: m[1], line: parseInt(m[2]), col: parseInt(m[3]), message: m[5], code: parseInt(m[4].slice(2)) });
    }
    return errors;
  }
}
export default { typecheckFiles };
