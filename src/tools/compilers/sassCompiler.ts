/**
 * @file sassCompiler.ts
 * @description Compiler wrapper for sassCompiler
 */

import { execSync } from "child_process";
export function compileSass(inputPath: string, outputPath: string, options: { style?: "compressed" | "expanded"; sourceMap?: boolean } = {}): void {
  const style = options.style ?? "expanded";
  const sourceMap = options.sourceMap ? "" : "--no-source-map";
  execSync(`npx sass --style=${style} ${sourceMap} "${inputPath}" "${outputPath}"`, { stdio: "inherit" });
}
export default { compileSass };
