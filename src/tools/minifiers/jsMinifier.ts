/**
 * @file jsMinifier.ts
 * @description Minifier for JavaScript
 */

import { transformSync } from "esbuild";
export function minifyJs(code: string): string {
  const result = transformSync(code, { minify: true, format: "cjs" });
  return result.code;
}
export function minifyJsFile(inputPath: string, outputPath?: string): string {
  const { readFileSync, writeFileSync } = require("fs");
  const code = readFileSync(inputPath, "utf-8") as string;
  const minified = minifyJs(code);
  if (outputPath) writeFileSync(outputPath, minified, "utf-8");
  return minified;
}
export default { minifyJs, minifyJsFile };
