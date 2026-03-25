/**
 * @file jsCompiler.ts
 * @description Compiler wrapper for jsCompiler
 */

import { transformSync } from "esbuild";
export function transpileJs(code: string, options: { target?: string; format?: "cjs" | "esm" | "iife" } = {}): string {
  const result = transformSync(code, { target: options.target ?? "es2022", format: options.format ?? "cjs" });
  return result.code;
}
export default { transpileJs };
