/**
 * @file lessCompiler.ts
 * @description Compiler wrapper for lessCompiler
 */

import { execSync } from "child_process";
export function compileLess(inputPath: string, outputPath: string): void {
  execSync(`npx lessc "${inputPath}" "${outputPath}"`, { stdio: "inherit" });
}
export default { compileLess };
